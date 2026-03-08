"""
KISAN-OS Agmarknet Integration Service
Fetches real-time market prices from Agmarknet API
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bs4 import BeautifulSoup
import asyncio


class AgmarknetService:
    """
    Service for fetching market prices from Agmarknet
    Uses official Agmarknet API for market price data
    """
    
    BASE_URL = "https://agmarknet.gov.in"
    API_URL = "https://agmarknet.gov.in/api"
    
    # Crop to commodity ID mapping (Common Indian crops)
    CROP_MAPPING = {
        "wheat": {"id": 23, "name": "Wheat"},
        "rice": {"id": 24, "name": "Rice"},
        "tomato": {"id": 38, "name": "Tomato"},
        "onion": {"id": 35, "name": "Onion"},
        "potato": {"id": 36, "name": "Potato"},
        "cotton": {"id": 10, "name": "Cotton"},
        "soybean": {"id": 74, "name": "Soybean"},
        "mustard": {"id": 31, "name": "Mustard"},
        "maize": {"id": 27, "name": "Maize"},
        "sugarcane": {"id": 60, "name": "Sugarcane"},
        "paddy": {"id": 44, "name": "Paddy"},
        "gram": {"id": 17, "name": "Gram"},
        "arhar": {"id": 6, "name": "Arhar/Tur"},
        "urad": {"id": 72, "name": "Urad"},
        "moong": {"id": 71, "name": "Moong"},
        "masoor": {"id": 28, "name": "Masoor"},
    }
    
    # Popular Mandis
    MANDI_MAPPING = {
        "delhi": {"code": "DL-Delhi", "state": "Delhi"},
        "bangalore": {"code": "KA-Bangalore", "state": "Karnataka"},
        "mumbai": {"code": "MH-Mumbai", "state": "Maharashtra"},
        "pune": {"code": "MH-Pune", "state": "Maharashtra"},
        "nagpur": {"code": "MH-Nagpur", "state": "Maharashtra"},
        "nashik": {"code": "MH-Nashik", "state": "Maharashtra"},
        "hyderabad": {"code": "TG-Hyderabad", "state": "Telangana"},
        "rohtak": {"code": "HR-Rohtak", "state": "Haryana"},
        "panipat": {"code": "HR-Panipat", "state": "Haryana"},
        "kolkata": {"code": "WB-Kolkata", "state": "West Bengal"},
        "pimpri": {"code": "MH-Pimpri", "state": "Maharashtra"},
        "yavatmal": {"code": "MH-Yavatmal", "state": "Maharashtra"},
    }

    # State codes mapping
    STATE_CODES = {
        "Andhra Pradesh": "AP",
        "Arunachal Pradesh": "AR",
        "Assam": "AS",
        "Bihar": "BR",
        "Chhattisgarh": "CG",
        "Goa": "GA",
        "Gujarat": "GJ",
        "Haryana": "HR",
        "Himachal Pradesh": "HP",
        "Jharkhand": "JH",
        "Karnataka": "KA",
        "Kerala": "KL",
        "Madhya Pradesh": "MP",
        "Maharashtra": "MH",
        "Odisha": "OR",
        "Punjab": "PB",
        "Rajasthan": "RJ",
        "Tamil Nadu": "TN",
        "Telangana": "TG",
        "Uttar Pradesh": "UP",
        "Uttarakhand": "UT",
        "West Bengal": "WB",
    }
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )
        self._cache = {}
        self._cache_expiry = {}

    async def close(self):
        await self.client.aclose()

    def _get_cache(self, key: str, max_age: int = 3600) -> Optional[Any]:
        """Get cached data if not expired"""
        if key in self._cache:
            if key in self._cache_expiry:
                if datetime.now() < self._cache_expiry[key]:
                    return self._cache[key]
        return None

    def _set_cache(self, key: str, data: Any, max_age: int = 3600):
        """Set cache with expiry"""
        self._cache[key] = data
        self._cache_expiry[key] = datetime.now() + timedelta(seconds=max_age)
    
    @classmethod
    async def get_crop_prices(
        cls,
        crop: str,
        state: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get market prices for a crop
        
        Args:
            crop: Crop name (e.g., 'tomato', 'onion')
            state: Optional state code
            days: Number of days of price history
            
        Returns:
            Dictionary with market prices and trend
        """
        try:
            crop_lower = crop.lower()
            if crop_lower not in cls.CROP_MAPPING:
                return {
                    "error": f"Crop '{crop}' not found",
                    "supported_crops": list(cls.CROP_MAPPING.keys())
                }
            
            # Mock data for demonstration
            # In production, this would call the actual Agmarknet API
            mock_prices = cls._generate_mock_prices(crop, state, days)
            return mock_prices
            
        except Exception as e:
            return {"error": str(e)}
    
    @classmethod
    async def get_mandi_prices(
        cls,
        crop: str,
        mandi: str
    ) -> Dict[str, Any]:
        """
        Get prices for a crop in a specific mandi
        
        Args:
            crop: Crop name
            mandi: Mandi name/code
            
        Returns:
            Price and trend information
        """
        try:
            crop_lower = crop.lower()
            mandi_lower = mandi.lower()
            
            if crop_lower not in cls.CROP_MAPPING:
                return {"error": f"Crop '{crop}' not found"}
            
            if mandi_lower not in cls.MANDI_MAPPING:
                return {"error": f"Mandi '{mandi}' not found"}
            
            # Mock data
            return {
                "crop": crop,
                "mandi": cls.MANDI_MAPPING[mandi_lower]["code"],
                "state": cls.MANDI_MAPPING[mandi_lower]["state"],
                "price_per_kg": round(20 + (hash(crop + mandi) % 50) / 10, 2),
                "min_price": round(15 + (hash(crop + mandi) % 30) / 10, 2),
                "max_price": round(30 + (hash(crop + mandi) % 50) / 10, 2),
                "modal_price": round(22 + (hash(crop + mandi) % 40) / 10, 2),
                "arrival_tons": round(100 + (hash(crop + mandi) % 500), 1),
                "date": datetime.utcnow().isoformat(),
                "trend": cls._determine_trend(crop, mandi)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    @classmethod
    async def get_best_mandi(
        cls,
        crop: str,
        states: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Find the best mandi (highest price) for a crop
        
        Args:
            crop: Crop name
            states: Optional list of states to search
            
        Returns:
            Best mandi option with price
        """
        try:
            crop_lower = crop.lower()
            if crop_lower not in cls.CROP_MAPPING:
                return {"error": f"Crop '{crop}' not found"}
            
            # Get prices from top mandis
            mandis_to_check = [
                "delhi", "bangalore", "mumbai", "pune", 
                "hyderabad", "rohtak", "kolkata"
            ]
            
            prices = []
            for mandi in mandis_to_check:
                price_data = await cls.get_mandi_prices(crop, mandi)
                if "price_per_kg" in price_data:
                    prices.append(price_data)
            
            if not prices:
                return {"error": "No price data found"}
            
            # Find best price
            best_mandi = max(prices, key=lambda x: x.get("price_per_kg", 0))
            
            return {
                "crop": crop,
                "best_mandi": best_mandi["mandi"],
                "best_state": best_mandi["state"],
                "best_price": best_mandi["price_per_kg"],
                "alternatives": sorted(prices, 
                                      key=lambda x: x.get("price_per_kg", 0), 
                                      reverse=True)[:3],
                "recommendation": f"Sell in {best_mandi['mandi']} for best price of ₹{best_mandi['price_per_kg']}/kg"
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    @classmethod
    async def get_price_trend(
        cls,
        crop: str,
        mandi: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get price trend for a crop over time
        
        Args:
            crop: Crop name
            mandi: Optional mandi name
            days: Number of days to analyze
            
        Returns:
            Price trend analysis
        """
        try:
            # Generate mock trend data
            base_price = 20 + (hash(crop) % 50)
            trend_points = []
            
            for day in range(days, 0, -1):
                variation = (hash(crop + str(day)) % 10) - 5
                price = base_price + variation
                trend_points.append({
                    "date": (datetime.utcnow() - timedelta(days=day)).isoformat(),
                    "price": round(price, 2)
                })
            
            prices = [p["price"] for p in trend_points]
            avg_price = sum(prices) / len(prices)
            trend_direction = "rising" if prices[-1] > prices[0] else "falling"
            
            return {
                "crop": crop,
                "mandi": mandi or "All",
                "trend_data": trend_points,
                "average_price": round(avg_price, 2),
                "current_price": round(prices[-1], 2),
                "min_price": round(min(prices), 2),
                "max_price": round(max(prices), 2),
                "trend": trend_direction,
                "days_analyzed": days
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    @classmethod
    def _generate_mock_prices(
        cls,
        crop: str,
        state: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """Generate realistic mock prices for demo/testing"""
        base_price = 20 + (hash(crop) % 50)
        
        prices_list = []
        for day in range(days, 0, -1):
            variation = (hash(crop + str(day)) % 10) - 5
            prices_list.append({
                "date": (datetime.utcnow() - timedelta(days=day)).isoformat(),
                "mandi": "Delhi Mandi",
                "price_per_kg": round(base_price + variation, 2),
                "arrival_tons": round(100 + (hash(crop + str(day)) % 500), 1)
            })
        
        return {
            "crop": crop,
            "state": state or "National",
            "prices": prices_list,
            "average_price": round(sum(p["price_per_kg"] for p in prices_list) / len(prices_list), 2),
            "trend": cls._determine_trend(crop, state or "National")
        }
    
    @classmethod
    def _determine_trend(cls, crop: str, location: str) -> str:
        """Determine price trend"""
        trend_hash = hash(crop + location + str(datetime.utcnow().day))
        if trend_hash % 3 == 0:
            return "rising"
        elif trend_hash % 3 == 1:
            return "falling"
        return "stable"

    async def get_market_prices(
        self,
        crop: str,
        state: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get market prices for a crop
        Uses mock data as fallback when API is unavailable
        """
        cache_key = f"prices_{crop}_{state}_{days}"
        
        # Check cache first
        cached = self._get_cache(cache_key, max_age=1800)  # 30 min cache
        if cached:
            return cached

        try:
            # Try to fetch from Agmarknet
            prices = await self._fetch_agmarknet_prices(crop, state, days)
            if prices:
                self._set_cache(cache_key, prices)
                return prices
        except Exception as e:
            print(f"Agmarknet fetch error: {e}")

        # Fallback to mock data
        return self._get_mock_prices(crop, state, days)

    async def _fetch_agmarknet_prices(
        self,
        crop: str,
        state: Optional[str] = None,
        days: int = 7
    ) -> Optional[List[Dict[str, Any]]]:
        """Fetch prices from Agmarknet API"""
        crop_info = self.CROP_MAPPING.get(crop.lower())
        if not crop_info:
            return None

        # Get today's date
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days)

        # Build API parameters
        params = {
            "commodity_id": crop_info["id"],
            "from_date": from_date.strftime("%Y-%m-%d"),
            "to_date": to_date.strftime("%Y-%m-%d"),
            "state": state if state else "",
            "format": "json"
        }

        try:
            response = await self.client.get(
                f"{self.API_URL}/commoditywise",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_agmarknet_response(data, crop)
        except Exception as e:
            print(f"API request error: {e}")

        return None

    def _parse_agmarknet_response(
        self,
        data: Dict[str, Any],
        crop: str
    ) -> List[Dict[str, Any]]:
        """Parse Agmarknet API response"""
        prices = []
        
        if not data or "data" not in data:
            return []

        for item in data.get("data", []):
            try:
                prices.append({
                    "mandi": item.get("market", ""),
                    "state": item.get("state", ""),
                    "price": float(item.get("modal_price", 0)),
                    "min_price": float(item.get("min_price", 0)),
                    "max_price": float(item.get("max_price", 0)),
                    "arrival": float(item.get("arrivals", 0)),
                    "date": item.get("arrival_date", ""),
                })
            except (ValueError, TypeError):
                continue

        return prices

    def _get_mock_prices(
        self,
        crop: str,
        state: Optional[str] = None,
        days: int = 7
    ) -> Dict[str, Any]:
        """Get mock prices as fallback"""
        mock_data = {
            "wheat": [
                {"mandi": "Azadpur Mandi", "state": "Delhi", "price": 2410, "min_price": 2350, "max_price": 2480, "arrival": 2500},
                {"mandi": "Khanna Mandi", "state": "Punjab", "price": 2280, "min_price": 2200, "max_price": 2350, "arrival": 3200},
                {"mandi": "Indore Mandi", "state": "Madhya Pradesh", "price": 2350, "min_price": 2280, "max_price": 2420, "arrival": 1800},
            ],
            "rice": [
                {"mandi": "Karnal Mandi", "state": "Haryana", "price": 3150, "min_price": 3000, "max_price": 3300, "arrival": 2100},
                {"mandi": "Cuttack Mandi", "state": "Odisha", "price": 2980, "min_price": 2850, "max_price": 3100, "arrival": 1500},
            ],
            "tomato": [
                {"mandi": "Kolar Mandi", "state": "Karnataka", "price": 1850, "min_price": 1500, "max_price": 2200, "arrival": 800},
                {"mandi": "Vashi Mandi", "state": "Maharashtra", "price": 2200, "min_price": 1800, "max_price": 2600, "arrival": 650},
            ],
            "onion": [
                {"mandi": "Lasalgaon", "state": "Maharashtra", "price": 1420, "min_price": 1200, "max_price": 1650, "arrival": 1200},
                {"mandi": "Nashik Mandi", "state": "Maharashtra", "price": 1280, "min_price": 1100, "max_price": 1450, "arrival": 1500},
            ],
            "potato": [
                {"mandi": "Farrukhabad Mandi", "state": "Uttar Pradesh", "price": 980, "min_price": 900, "max_price": 1050, "arrival": 2000},
                {"mandi": "Azadpur Mandi", "state": "Delhi", "price": 1050, "min_price": 950, "max_price": 1150, "arrival": 2200},
            ],
            "cotton": [
                {"mandi": "Rajkot Mandi", "state": "Gujarat", "price": 7100, "min_price": 6800, "max_price": 7400, "arrival": 400},
            ],
            "soybean": [
                {"mandi": "Indore Mandi", "state": "Madhya Pradesh", "price": 4600, "min_price": 4400, "max_price": 4800, "arrival": 600},
            ],
            "mustard": [
                {"mandi": "Jaipur Mandi", "state": "Rajasthan", "price": 5450, "min_price": 5200, "max_price": 5700, "arrival": 300},
            ],
        }

        prices = mock_data.get(crop.lower(), mock_data["wheat"])
        
        # Filter by state if provided
        if state:
            prices = [p for p in prices if p["state"].lower() == state.lower()]

        return {
            "crop": crop,
            "unit": "per quintal",
            "prices": prices,
            "source": "Agmarknet (Mock - API unavailable)",
            "date": datetime.now().isoformat()
        }

    async def get_price_trends(
        self,
        crop: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get historical price trends"""
        cache_key = f"trends_{crop}_{days}"
        
        cached = self._get_cache(cache_key, max_age=3600)
        if cached:
            return cached

        # Generate mock trend data
        base_price = 2000
        trends = []
        
        for i in range(days, 0, -1):
            date = datetime.now() - timedelta(days=i)
            # Add some realistic variation
            variation = (hash(f"{crop}{i}") % 20 - 10) / 100
            avg_price = base_price * (1 + variation)

            trends.append({
                "date": date.strftime("%Y-%m-%d"),
                "avg_price": round(avg_price, 2),
                "min_price": round(avg_price * 0.9, 2),
                "max_price": round(avg_price * 1.1, 2)
            })

        self._set_cache(cache_key, trends)
        return trends

    async def get_market_recommendations(
        self,
        crop: str,
        quantity: float,
        pickup_lat: float,
        pickup_lng: float
    ) -> List[Dict[str, Any]]:
        """Get best market recommendations considering transport costs"""
        
        prices_data = await self.get_market_prices(crop)
        prices = prices_data.get("prices", [])

        # Mandi coordinates (sample)
        mandi_coords = {
            "Azadpur Mandi": (28.7431, 77.1522, "Delhi"),
            "Khanna Mandi": (30.9983, 76.2098, "Punjab"),
            "Indore Mandi": (22.7196, 75.8577, "Madhya Pradesh"),
            "Karnal Mandi": (29.6857, 76.9885, "Haryana"),
            "Vashi Mandi": (19.0661, 73.0156, "Maharashtra"),
            "Lasalgaon": (20.2500, 74.5333, "Maharashtra"),
            "Nashik Mandi": (20.0112, 73.7908, "Maharashtra"),
            "Kolar Mandi": (13.1378, 77.6047, "Karnataka"),
            "Rajkot Mandi": (22.3039, 70.8022, "Gujarat"),
            "Jaipur Mandi": (26.9124, 75.7873, "Rajasthan"),
        }

        recommendations = []

        for market in prices:
            mandi_name = market.get("mandi", "")
            if mandi_name in mandi_coords:
                mandi_lat, mandi_lng, state = mandi_coords[mandi_name]

                # Calculate rough distance (km)
                distance = ((pickup_lat - mandi_lat) ** 2 + (pickup_lng - mandi_lng) ** 2) ** 0.5 * 111

                # Transport cost (₹10/km for mini truck)
                transport_cost = distance * 10 * 1.5

                # Total revenue
                total_revenue = market["price"] * quantity

                # Net profit after transport
                net_profit = total_revenue - transport_cost

                # Recommendation score
                score = net_profit / 1000

                recommendations.append({
                    "mandi": mandi_name,
                    "state": state,
                    "price": market["price"],
                    "distance_km": round(distance, 1),
                    "transport_cost": round(transport_cost, 2),
                    "total_revenue": round(total_revenue, 2),
                    "net_profit": round(net_profit, 2),
                    "recommendation_score": round(score, 2)
                })

        # Sort by net profit
        recommendations.sort(key=lambda x: x["net_profit"], reverse=True)

        return recommendations[:5]

    async def get_available_crops(self) -> List[Dict[str, Any]]:
        """Get list of all available crops"""
        return [
            {"id": info["id"], "name": info["name"]}
            for crop, info in self.CROP_MAPPING.items()
        ]


# Singleton instance
agmarknet_service = AgmarknetService()


async def get_agmarknet_service() -> AgmarknetService:
    """Get Agmarknet service instance"""
    return agmarknet_service

