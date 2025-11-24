import os
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Get industry IDs
industries = supabase.table("industries").select("id, name").execute()
industry_map = {ind["name"]: ind["id"] for ind in industries.data}

# Define all remaining niches by industry
remaining_niches = {
    "Hospitality & Food": [
        # Part 2 - remaining 41 niches
        ('Supermarkets and Grocery Chains', 'National', 'Big'),
        ('Health and Organic Food Stores', 'Local', 'Small'),
        ('Ice Cream and Frozen Yogurt Parlors', 'Local', 'Small'),
        ('Indian Cuisine Restaurants', 'Local', 'Small'),
        ('Irish Pubs and Restaurants', 'Local', 'Small'),
        ('Italian Food Retail', 'Local', 'Small'),
        ('Japanese Cuisine Restaurants', 'Local', 'Small'),
        ('Commercial Kitchen Equipment Suppliers', 'National', 'Big'),
        ('Korean Cuisine Restaurants', 'Local', 'Small'),
        ('Kosher Food and Restaurants', 'Local', 'Small'),
        ('Liquor and Wine Retail Stores', 'Local', 'Small'),
        ('Lunch Cafes and Bistros', 'Local', 'Small'),
        ('Meat and Butcher Shops', 'Local', 'Small'),
        ('Mexican Grocery and Foods Retail', 'Local', 'Small'),
        ('Mexican Restaurants', 'Local', 'Small'),
        ('Middle Eastern Restaurants', 'Local', 'Small'),
        ('Oriental Food and Goods Retailers', 'Local', 'Small'),
        ('Pizza Delivery Services', 'National', 'Big'),
        ('Pub and Tavern Establishments', 'Local', 'Small'),
        ('Restaurant Equipment Retail', 'National', 'Big'),
        ('Restaurant Equipment and Service Providers', 'National', 'Big'),
        ('Wholesale Restaurant Supplies', 'National', 'Big'),
        ('General Restaurants', 'Local', 'Small'),
        ('Sandwich Shops', 'Local', 'Small'),
        ('Seafood Restaurants', 'Local', 'Small'),
        ('Soul Food Restaurants', 'Local', 'Small'),
        ('Spanish Cuisine Restaurants', 'Local', 'Small'),
        ('Gourmet and Specialty Food Retailers', 'National', 'Big'),
        ('Sports Bars', 'Local', 'Small'),
        ('Steak and Seafood Grills', 'Local', 'Small'),
        ('Steakhouses', 'Local', 'Small'),
        ('Sushi Bars', 'Local', 'Small'),
        ('Taverns and Breweries', 'Local', 'Small'),
        ('Thai Cuisine Restaurants', 'Local', 'Small'),
        ('Used Restaurant Equipment Stores', 'Local', 'Small'),
        ('Vegetarian and Vegan Restaurants', 'Local', 'Small'),
        ('Vending Machine Suppliers', 'National', 'Big'),
        ('Water Coolers and Fountain Suppliers', 'National', 'Big'),
        ('Wedding Catering Services', 'Local', 'Small'),
        ('Wine and Spirit Retail Stores', 'Local', 'Small'),
    ],
    # Add all remaining industries here...
    # Medicine & Health (95), Home Improvements (78), Agriculture & Mining (81), 
    # Legal & Financial (122), Media & Comms (43), Fitness & Personal Care (58),
    # Real Estate (66), Shopping & Retail (74), Sports (81), Travel & Transport (87),
    # Community and Government (94)
}

# Insert all niches
for industry_name, niches in remaining_niches.items():
    industry_id = industry_map[industry_name]
    for niche_name, scale, database_size in niches:
        supabase.table("niches").insert({
            "niche_name": niche_name,
            "industry_id": industry_id,
            "scale": scale,
            "database_size": database_size
        }).execute()
    print(f"Inserted {len(niches)} niches for {industry_name}")

print("Niche import complete!")
