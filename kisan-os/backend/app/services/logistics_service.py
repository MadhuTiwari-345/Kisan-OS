"""
KISAN-OS Logistics Optimization Service
Milk-Run Algorithm: Consolidated Rural Aggregation using Google OR-Tools

Solves:
- Vehicle Routing Problem (VRP) with capacity constraints
- Cost optimization for collective farming deliveries
- Multi-stop routing to Mandis
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import math

logger = logging.getLogger(__name__)

try:
    from ortools.linear_solver import pywraplp
    from ortools.routing import routing_enums_pb2
    from ortools.routing import routing_index_manager
    from ortools.routing import routing_model
    OR_TOOLS_AVAILABLE = True
except ImportError:
    OR_TOOLS_AVAILABLE = False
    logger.warning("OR-Tools not available - basic routing only")


@dataclass
class Location:
    """Represents a geographic location"""
    lat: float
    lng: float
    
    def distance_to(self, other: "Location") -> float:
        """Calculate distance in km using Haversine formula"""
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(self.lat)
        lat2_rad = math.radians(other.lat)
        delta_lat = math.radians(other.lat - self.lat)
        delta_lng = math.radians(other.lng - self.lng)
        
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c


@dataclass
class TransportNode:
    """A pickup or delivery location"""
    id: str
    location: Location
    weight_kg: float = 0.0
    volume_cubic_meters: float = 0.0
    node_type: str = "pickup"  # pickup or destination
    name: str = ""
    contact: str = ""
    
    def __hash__(self):
        return hash(self.id)
    
    def __eq__(self, other):
        return self.id == other.id


class MilkRunOptimizer:
    """
    Milk-Run algorithm implementation using OR-Tools
    
    Problem:
    - 5 farmers in villages A, B, C, D, E want to send crops to Mandi
    - Distances: A→B=8km, B→C=5km, C→D=10km, etc.
    - Capacity: Single truck = 1000kg
    - Cost: ₹15/km + ₹500/hour labor
    
    Solution:
    - Consolidate loads into a single milk-run route
    - Optimize pickup sequence to minimize distance
    - Reduce cost per farmer by 60-80%
    """
    
    def __init__(self):
        self.or_tools_available = OR_TOOLS_AVAILABLE
        logger.info(f"OR-Tools available: {self.or_tools_available}")
    
    def calculate_route_cost(
        self,
        route: List[TransportNode],
        fuel_cost_per_km: float = 15.0,
        labor_cost_per_hour: float = 500.0
    ) -> Dict[str, float]:
        """
        Calculate cost for a route
        
        Cost = (Total Distance × Fuel Cost/km) + (Travel Time × Labor Cost/hour)
        """
        if len(route) < 2:
            return {"distance_km": 0.0, "fuel_cost": 0.0, "labor_cost": 0.0, "total": 0.0}
        
        total_distance = 0.0
        for i in range(len(route) - 1):
            distance = route[i].location.distance_to(route[i + 1].location)
            total_distance += distance
        
        # Estimate travel time (assume 40 km/h average speed)
        travel_time_hours = total_distance / 40.0
        
        # Add buffer for loading/unloading (5 min per stop)
        loading_time_hours = len(route) * (5 / 60.0)
        total_time_hours = travel_time_hours + loading_time_hours
        
        fuel_cost = total_distance * fuel_cost_per_km
        labor_cost = total_time_hours * labor_cost_per_hour
        
        return {
            "distance_km": total_distance,
            "fuel_cost": fuel_cost,
            "labor_cost": labor_cost,
            "total": fuel_cost + labor_cost,
            "travel_time_hours": travel_time_hours,
            "total_time_hours": total_time_hours,
        }
    
    async def optimize_milk_run(
        self,
        pickup_nodes: List[TransportNode],
        destination_node: TransportNode,
        vehicle_capacity_kg: float = 1000.0,
        max_vehicles: int = 1
    ) -> Dict[str, Any]:
        """
        Optimize milk-run route for a set of pickups
        
        Uses OR-Tools Capacitated Vehicle Routing Problem (CVRP)
        
        Args:
            pickup_nodes: List of farmer pickup locations
            destination_node: Mandi destination
            vehicle_capacity_kg: Truck capacity
            max_vehicles: Number of vehicles available
        
        Returns:
            {
                "routes": [[farm1, farm2, mandi]],
                "total_distance_km": 47.3,
                "total_cost": 1050.0,
                "cost_per_farmer": 210.0,
                "savings_per_farmer": 320.0,
                "optimization_algorithm": "or-tools-cvrp"
            }
        """
        logger.info(
            f"🚚 Optimizing milk-run: {len(pickup_nodes)} pickups → {destination_node.name}"
        )
        
        # Check total capacity
        total_weight = sum(node.weight_kg for node in pickup_nodes)
        logger.info(f"Total load: {total_weight}kg (capacity: {vehicle_capacity_kg}kg)")
        
        if total_weight > vehicle_capacity_kg * max_vehicles:
            logger.warning("⚠️ Total weight exceeds vehicle capacity - splitting required")
        
        if not self.or_tools_available:
            logger.warning("OR-Tools not available - using nearest-neighbor heuristic")
            return self._nearest_neighbor_routing(
                pickup_nodes,
                destination_node,
                vehicle_capacity_kg
            )
        
        try:
            return await self._or_tools_optimization(
                pickup_nodes,
                destination_node,
                vehicle_capacity_kg,
                max_vehicles
            )
        except Exception as e:
            logger.error(f"OR-Tools optimization failed: {str(e)}")
            return self._nearest_neighbor_routing(
                pickup_nodes,
                destination_node,
                vehicle_capacity_kg
            )
    
    async def _or_tools_optimization(
        self,
        pickup_nodes: List[TransportNode],
        destination_node: TransportNode,
        vehicle_capacity_kg: float,
        max_vehicles: int
    ) -> Dict[str, Any]:
        """Actual OR-Tools CVRP optimization"""
        
        # Create nodes list: [destination, pickup1, pickup2, ...]
        all_nodes = [destination_node] + pickup_nodes
        
        # Create distance matrix
        n_nodes = len(all_nodes)
        distance_matrix = [[0.0] * n_nodes for _ in range(n_nodes)]
        
        for i in range(n_nodes):
            for j in range(n_nodes):
                if i != j:
                    distance_matrix[i][j] = all_nodes[i].location.distance_to(
                        all_nodes[j].location
                    )
        
        # Create capacity array
        demands = [0] + [node.weight_kg for node in pickup_nodes]
        
        # Create routing model
        manager = routing_index_manager.RoutingIndexManager(
            n_nodes,
            max_vehicles,
            0  # Start and end at destination (index 0)
        )
        
        routing = routing_model.RoutingModel(manager)
        
        # Define distance callback
        def distance_callback(from_index, to_index):
            return int(distance_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)] * 1000)
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add capacity dimension
        def demand_callback(from_index):
            node = manager.IndexToNode(from_index)
            return demands[node]
        
        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimension(
            demand_callback_index,
            0,  # No slack
            int(vehicle_capacity_kg),  # Capacity
            True,  # Cumulative
            'Capacity'
        )
        
        # Set search parameters
        search_parameters = routing_enums_pb2.RoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(30)
        
        # Solve
        solution = routing.SolveFromAssignmentWithParameters(
            routing.ReadAssignmentFromRoutes([[]], True),
            search_parameters
        )
        
        if not solution:
            logger.warning("No solution found")
            return self._nearest_neighbor_routing(
                pickup_nodes,
                destination_node,
                vehicle_capacity_kg
            )
        
        # Extract solution
        routes = []
        total_distance = 0.0
        
        for vehicle_id in range(max_vehicles):
            index = routing.Start(vehicle_id)
            route = []
            distance = 0.0
            
            while not routing.IsEnd(index):
                node_idx = manager.IndexToNode(index)
                route.append(all_nodes[node_idx])
                
                next_index = solution.Value(routing.NextVar(index))
                next_node_idx = manager.IndexToNode(next_index)
                distance += distance_matrix[node_idx][next_node_idx]
                
                index = next_index
            
            # Add destination as last node
            route.append(destination_node)
            
            if len(route) > 1:  # Only add non-empty routes
                routes.append(route)
                total_distance += distance
        
        # Calculate costs
        total_cost = self.calculate_route_cost(routes[0] if routes else [])['total']
        cost_per_farmer = total_cost / len(pickup_nodes) if pickup_nodes else 0.0
        
        # Baseline cost (direct delivery to mandi)
        baseline_cost = sum([
            self.calculate_route_cost([node, destination_node])['total']
            for node in pickup_nodes
        ])
        savings = baseline_cost - total_cost
        savings_per_farmer = savings / len(pickup_nodes) if pickup_nodes else 0.0
        
        logger.info(
            f"✓ Optimization complete: {total_distance:.1f}km, "
            f"₹{total_cost:.0f} total, ₹{savings_per_farmer:.0f} saved/farmer"
        )
        
        return {
            "routes": routes,
            "total_distance_km": total_distance,
            "total_cost": total_cost,
            "cost_per_farmer": cost_per_farmer,
            "savings_per_farmer": savings_per_farmer,
            "num_vehicles_used": len(routes),
            "optimization_algorithm": "or-tools-cvrp",
        }
    
    def _nearest_neighbor_routing(
        self,
        pickup_nodes: List[TransportNode],
        destination_node: TransportNode,
        vehicle_capacity_kg: float
    ) -> Dict[str, Any]:
        """
        Fallback: Nearest-neighbor greedy algorithm
        Fast but not optimal - used when OR-Tools unavailable
        """
        logger.info("Using nearest-neighbor heuristic...")
        
        routes = []
        remaining_nodes = set(pickup_nodes)
        current_weight = 0.0
        current_route = [destination_node]
        
        # Greedy nearest-neighbor
        while remaining_nodes:
            last_node = current_route[-1]
            
            # Find nearest unvisited node
            nearest = min(
                remaining_nodes,
                key=lambda n: last_node.location.distance_to(n.location)
            )
            
            # Check capacity
            if current_weight + nearest.weight_kg > vehicle_capacity_kg:
                # Complete current route
                current_route.append(destination_node)
                routes.append(current_route)
                current_route = [destination_node]
                current_weight = 0.0
            
            current_route.append(nearest)
            current_weight += nearest.weight_kg
            remaining_nodes.remove(nearest)
        
        # Complete last route
        if len(current_route) > 1:
            current_route.append(destination_node)
            routes.append(current_route)
        
        # Calculate metrics
        total_distance = 0.0
        for route in routes:
            for i in range(len(route) - 1):
                total_distance += route[i].location.distance_to(route[i + 1].location)
        
        costs = [self.calculate_route_cost(route) for route in routes]
        total_cost = sum(c['total'] for c in costs)
        cost_per_farmer = total_cost / len(pickup_nodes) if pickup_nodes else 0.0
        
        return {
            "routes": routes,
            "total_distance_km": total_distance,
            "total_cost": total_cost,
            "cost_per_farmer": cost_per_farmer,
            "num_vehicles_used": len(routes),
            "optimization_algorithm": "nearest-neighbor-heuristic",
        }


# Global instance
milk_run_optimizer = MilkRunOptimizer()
