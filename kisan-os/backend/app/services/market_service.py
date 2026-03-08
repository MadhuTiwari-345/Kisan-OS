"""
KISAN-OS Market Intelligence Service
Real-time commodity price tracking and market analysis

Integrates with:
- Agmarknet (Government Agricultural Market Database)
- ENAM (National e-Market for Agriculture)
- Local Mandi price feeds
- Market trend analysis
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import httpx
from bs4 import BeautifulSoup

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgmarknetScraper:
    """
    Scrapes and processes Agmarknet commodity prices
    Data source: https://agmarknet.gov.in
    
    Provides:
    - Real-time commodity prices by mandi
    - Arrival quantities
    - Price trends (increasing/decreasing)
    """
    
    def __init__(self):
        self.base_url = settings.AGMARKNET_API_URL
        self.http_client = httpx.AsyncClient(timeout=30.0)
        self.cache = {}
        self.cache_ttl_seconds = 3600  # 1 hour
    
    async def fetch_commodity_prices(
        self,
        commodity_name: str,
        state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch current prices for a commodity across mandis
        
        Args:
            commodity_name: e.g., "Onion", "Tomato", "Wheat"
            state: e.g., "MAHARASHTRA", "KARNATAKA"
        
        Returns:
            [
                {
                    "mandi_name": "Delhi Mandi",
                    "mandi_code": "DH001",
                    "price_min": 18.0,
                    "price_max": 22.0,
                    "price_avg": 20.0,
                    "arrival_quantity_quintal": 850.0,
                    "reported_date": "2024-01-15",
                    "trend": "increasing"
                }
            ]
        """
        cache_key = f"{commodity_name}:{state or 'ALL'}"
        
        # Check cache
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if datetime.utcnow() - cached['timestamp'] < timedelta(seconds=self.cache_ttl_seconds):
                logger.info(f"✓ Returning cached prices for {commodity_name}")
                return cached['data']
        
        try:
            logger.info(f"📊 Fetching {commodity_name} prices from Agmarknet...")
            
            # Mock API response - in production, parse actual Agmarknet HTML/API
            prices = [
                {
                    "mandi_name": "Delhi Mandi",
                    "mandi_id": 1,
                    "state": "DELHI",
                    "price_min": 18.0,
                    "price_max": 22.0,
                    "price_avg": 20.0,
                    "currency": "INR",
                    "arrival_quantity_quintal": 850.0,
                    "reported_date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "trend": "increasing",
                },
                {
                    "mandi_name": "Azadpur Mandi",
                    "mandi_id": 2,
                    "state": "DELHI",
                    "price_min": 20.0,
                    "price_max": 24.0,
                    "price_avg": 22.0,
                    "currency": "INR",
                    "arrival_quantity_quintal": 1200.0,
                    "reported_date": datetime.utcnow().strftime("%Y-%m-%d"),
                    "trend": "stable",
                },
            ]
            
            # Cache the result
            self.cache[cache_key] = {
                'data': prices,
                'timestamp': datetime.utcnow(),
            }
            
            logger.info(f"✓ Fetched prices from {len(prices)} mandis")
            return prices
        
        except Exception as e:
            logger.error(f"Failed to fetch prices: {str(e)}")
            return []
    
    async def close(self):
        await self.http_client.aclose()


class PriceAnalysisService:
    """
    Analyzes price trends and provides recommendations
    """
    
    @staticmethod
    def analyze_price_trend(
        historical_prices: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze price trend from historical data
        
        Returns:
            {
                "trend": "increasing",  # increasing, decreasing, stable
                "trend_strength": 0.75,
                "average_price": 20.5,
                "price_volatility": 0.12,
                "recommendation": "Good time to sell"
            }
        """
        if not historical_prices or len(historical_prices) < 2:
            return {
                "trend": "unknown",
                "trend_strength": 0.0,
                "recommendation": "Insufficient data"
            }
        
        # Calculate statistics
        prices = [p.get('price_avg', 0) for p in historical_prices]
        avg_price = sum(prices) / len(prices)
        
        # Calculate price change
        if prices[0] > 0:
            price_change = (prices[-1] - prices[0]) / prices[0]
        else:
            price_change = 0
        
        # Determine trend
        if price_change > 0.05:
            trend = "increasing"
            recommendation = "⬆️ Price is increasing - consider waiting if possible"
        elif price_change < -0.05:
            trend = "decreasing"
            recommendation = "⬇️ Price is decreasing - consider selling soon"
        else:
            trend = "stable"
            recommendation = "💠 Price is stable - good time to sell"
        
        # Calculate volatility (standard deviation)
        variance = sum((p - avg_price) ** 2 for p in prices) / len(prices)
        volatility = (variance ** 0.5) / avg_price if avg_price > 0 else 0
        
        return {
            "trend": trend,
            "trend_strength": abs(price_change),
            "average_price": avg_price,
            "price_volatility": volatility,
            "price_change_percent": price_change * 100,
            "recommendation": recommendation,
        }


class MandiBestPriceService:
    """
    Recommends the best mandi for selling
    Considers:
    - Price offered
    - Distance from farm
    - Market demand/liquidity
    - ONDC registration (direct buyer access)
    """
    
    async def find_best_mandi(
        self,
        commodity: str,
        farmer_location: tuple,  # (lat, lng)
        state: Optional[str] = None,
        weight_kg: float = 1000.0
    ) -> Dict[str, Any]:
        """
        Find the best mandi for the farmer to sell
        
        Returns:
            {
                "recommended_mandi": "Azadpur Mandi",
                "mandi_id": 2,
                "expected_price": 22.0,
                "distance_km": 18.5,
                "estimated_net_profit": 18500.0,  # after transport costs
                "ondc_enabled": true,
                "buyer_incentive": "MQA scheme for organic"
            }
        """
        
        logger.info(f"🎯 Finding best mandi for {commodity} ({weight_kg}kg)")
        
        # Get prices from all mandis
        agmarknet = AgmarknetScraper()
        prices = await agmarknet.fetch_commodity_prices(commodity, state)
        await agmarknet.close()
        
        if not prices:
            logger.warning("No prices available")
            return {}
        
        # Calculate net profit after transport for each mandi
        best_option = None
        best_net_profit = -float('inf')
        
        for mandi in prices[:5]:  # Top 5 by price
            mandi_location = (20.6259, 77.1092)  # Mock coordinates
            
            # Simplified distance calculation
            distance_km = ((
                (farmer_location[0] - mandi_location[0]) ** 2 +
                (farmer_location[1] - mandi_location[1]) ** 2
            ) ** 0.5) * 111  # 1 degree ≈ 111 km
            
            # Estimate transport cost
            transport_cost = distance_km * settings.DEFAULT_FUEL_COST_PER_KM / weight_kg * 1000
            
            # Calculate net profit
            gross_revenue = mandi.get('price_avg', 0) * weight_kg / 100  # Convert to kg
            net_profit = gross_revenue - transport_cost
            
            mandi['distance_km'] = distance_km
            mandi['transport_cost'] = transport_cost
            mandi['net_profit'] = net_profit
            
            if net_profit > best_net_profit:
                best_net_profit = net_profit
                best_option = mandi
        
        if best_option:
            logger.info(
                f"✓ Best mandi: {best_option['mandi_name']} "
                f"(₹{best_option['net_profit']:.0f} net profit)"
            )
            
            return {
                "recommended_mandi": best_option['mandi_name'],
                "mandi_id": best_option.get('mandi_id', 0),
                "expected_price": best_option.get('price_avg', 0),
                "distance_km": best_option.get('distance_km', 0),
                "transport_cost": best_option.get('transport_cost', 0),
                "estimated_net_profit": best_option.get('net_profit', 0),
                "ondc_enabled": True,  # Placeholder
            }
        
        return {}


class DemandForecastService:
    """
    Forecasts demand and price movements
    Uses historical data + seasonal patterns
    """
    
    @staticmethod
    def forecast_price_movement(
        commodity: str,
        days_ahead: int = 7
    ) -> Dict[str, Any]:
        """
        Forecast price for next N days
        
        Returns:
            {
                "commodity": "Tomato",
                "forecast_days": 7,
                "predicted_price": 25.0,
                "confidence": 0.72,
                "factors": ["Festival demand", "Reduced supply", "Seasonal peak"]
            }
        """
        
        # Simplified forecast - in production use time-series models
        seasonal_factors = {
            "Tomato": 1.15,  # High in winter
            "Onion": 1.08,
            "Wheat": 0.95,
        }
        
        base_forecast = 20.0  # Mock baseline
        seasonal_multiplier = seasonal_factors.get(commodity, 1.0)
        predicted_price = base_forecast * seasonal_multiplier
        
        return {
            "commodity": commodity,
            "forecast_days": days_ahead,
            "predicted_price": predicted_price,
            "price_movement": "increasing",
            "confidence": 0.72,
            "factors": [
                f"{days_ahead} days average forecast",
                "Based on seasonal patterns",
                "Subject to weather conditions"
            ],
        }


class MarketIntelligenceOrchestration:
    """
    Orchestrates all market intelligence services
    """
    
    def __init__(self):
        self.agmarknet = AgmarknetScraper()
        self.price_analysis = PriceAnalysisService()
        self.mandi_recommendation = MandiBestPriceService()
        self.demand_forecast = DemandForecastService()
    
    async def get_market_intelligence(
        self,
        commodity: str,
        farmer_location: tuple,
        production_weight_kg: float = 1000.0,
        state: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete market intelligence for a commodity
        
        Provides:
        - Current prices across mandis
        - Best mandi recommendation
        - Price trends
        - Demand forecast
        - Selling recommendations
        """
        
        logger.info(f"📈 Gathering market intelligence for {commodity}...")
        
        try:
            # Get current prices
            current_prices = await self.agmarknet.fetch_commodity_prices(
                commodity,
                state
            )
            
            # Analyze trends
            trend_analysis = self.price_analysis.analyze_price_trend(current_prices)
            
            # Find best mandi
            best_mandi = await self.mandi_recommendation.find_best_mandi(
                commodity,
                farmer_location,
                state,
                production_weight_kg
            )
            
            # Forecast demand
            demand_forecast = self.demand_forecast.forecast_price_movement(commodity)
            
            logger.info(f"✓ Market intelligence gathered for {commodity}")
            
            return {
                "commodity": commodity,
                "current_prices": current_prices,
                "price_trend": trend_analysis,
                "recommended_mandi": best_mandi,
                "demand_forecast": demand_forecast,
                "generated_at": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Market intelligence error: {str(e)}")
            return {
                "error": str(e),
                "commodity": commodity,
            }
    
    async def close(self):
        await self.agmarknet.close()


# Global instance
market_intelligence = MarketIntelligenceOrchestration()
