import unittest
from datetime import datetime, timedelta

from app.core.models import CropListing, Order, PriceIndex
from app.services.forecasting_service import forecast_demand, predict_price


class ForecastingServiceTests(unittest.TestCase):
    def test_predict_price_detects_rising_trend(self):
        now = datetime.utcnow()
        prices = [
            PriceIndex(
                mandi_id=1,
                commodity_name="onion",
                price_per_quintal=1500 + (i * 50),
                price_per_kg=15 + (i * 0.5),
                arrival_quantity_quintals=1000,
                trend="rising",
                recorded_at=now - timedelta(days=4 - i),
            )
            for i in range(5)
        ]

        result = predict_price(
            crop_name="onion",
            state="Haryana",
            season="rabi",
            historical_prices=prices,
            weather_risk=0.1,
            demand_score=0.8,
        )

        self.assertEqual(result["trend"], "rising")
        self.assertGreater(result["predicted_price_per_kg"], result["current_average_price_per_kg"])
        self.assertGreater(result["recommended_price_per_kg"], 0)

    def test_forecast_demand_marks_high_signal_when_demand_outpaces_supply(self):
        listings = [
            CropListing(
                id=1,
                farmer_id=1,
                crop_name="tomato",
                quantity_kg=300,
                price_per_kg=22,
                mandi_name="Azadpur Mandi",
                status="active",
            )
        ]
        orders = [
            Order(
                id=1,
                buyer_name="FreshMart",
                listing_id=1,
                farmer_id=1,
                quantity_kg=250,
                price_per_kg=22,
                total_amount=5500,
            ),
            Order(
                id=2,
                buyer_name="FreshMart",
                listing_id=1,
                farmer_id=1,
                quantity_kg=120,
                price_per_kg=22,
                total_amount=2640,
            ),
        ]

        forecast = forecast_demand(crop_name="tomato", orders=orders, listings=listings, lookahead_days=21)

        self.assertEqual(forecast["items"][0]["crop"], "tomato")
        self.assertEqual(forecast["items"][0]["demand_signal"], "high")
        self.assertEqual(forecast["items"][0]["planting_signal"], "increase acreage")


if __name__ == "__main__":
    unittest.main()
