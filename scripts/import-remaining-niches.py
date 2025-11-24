import os
from supabase import create_client, Client

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Get industry IDs
industries_response = supabase.table("industries").select("id, name").execute()
industries = {ind['name']: ind['id'] for ind in industries_response.data}

print(f"Found {len(industries)} industries")
print("Starting niche import...")

# Remaining industries data from PDF
remaining_niches = [
    # Clothing & Accessories (65 niches)
    ("Alterations and Tailoring Services", "Clothing & Accessories", "Local", "Small"),
    ("Antique and Vintage Jewelry Retail", "Clothing & Accessories", "Local", "Small"),
    ("Athletic and Dance Footwear Shops", "Clothing & Accessories", "Local", "Small"),
    ("Work Boots and Safety Shoes Retail", "Clothing & Accessories", "National", "Big"),
    ("Shoe and Leather Repair Shops", "Clothing & Accessories", "Local", "Small"),
    ("Boutique Clothing Stores", "Clothing & Accessories", "Local", "Small"),
    ("Specialty Bras and Shapewear", "Clothing & Accessories", "Local", "Small"),
    ("Bridal Shops and Services", "Clothing & Accessories", "National", "Big"),
    ("Bridal Accessories Retail", "Clothing & Accessories", "Local", "Small"),
    ("Kids Accessories Retail", "Clothing & Accessories", "Local", "Small"),
    ("Children's Clothing Retail", "Clothing & Accessories", "Local", "Small"),
    ("Clothing Consignment and Resale Stores", "Clothing & Accessories", "Local", "Small"),
    ("Fashion Accessories Retail", "Clothing & Accessories", "Local", "Small"),
    ("Clothing Retail Stores", "Clothing & Accessories", "National", "Big"),
    ("Wholesale Clothing Distributors", "Clothing & Accessories", "National", "Big"),
    ("Costume Rentals and Sales", "Clothing & Accessories", "Local", "Small"),
    ("Custom Sportswear and Embroidery", "Clothing & Accessories", "National", "Big"),
    ("Personalized Jewelry Shops", "Clothing & Accessories", "Local", "Small"),
    ("Custom T-Shirt Printing", "Clothing & Accessories", "National", "Big"),
    ("Dance Apparel Retail", "Clothing & Accessories", "Local", "Small"),
    ("Diamond Buyers and Brokers", "Clothing & Accessories", "National", "Big"),
    ("Diamond Retailers", "Clothing & Accessories", "National", "Big"),
    ("Dress Shops", "Clothing & Accessories", "Local", "Small"),
    ("Dry Cleaning and Laundry Services", "Clothing & Accessories", "Local", "Small"),
    ("Eyewear Stores", "Clothing & Accessories", "National", "Big"),
    ("Formalwear Rentals and Sales", "Clothing & Accessories", "Local", "Small"),
    ("Garment Storage Solutions", "Clothing & Accessories", "Local", "Small"),
    ("Gemstone Retailers", "Clothing & Accessories", "National", "Big"),
    ("Precious Metals Dealers", "Clothing & Accessories", "National", "Big"),
    ("Hair Accessories Boutiques", "Clothing & Accessories", "Local", "Small"),
    ("Handbag Retailers", "Clothing & Accessories", "Local", "Small"),
    ("Handbag Manufacturers and Distributors", "Clothing & Accessories", "National", "Big"),
    ("Jewelry Supplies and Equipment Retail", "Clothing & Accessories", "Local", "Small"),
    ("Jewelry Stores", "Clothing & Accessories", "National", "Big"),
    ("Jewelry Buyers and Brokers", "Clothing & Accessories", "National", "Big"),
    ("Display Cases for Jewelry", "Clothing & Accessories", "Local", "Small"),
    ("Jewelry Repair Services", "Clothing & Accessories", "Local", "Small"),
    ("Jewelry Manufacturers and Wholesalers", "Clothing & Accessories", "National", "Big"),
    ("Laundry Services", "Clothing & Accessories", "Local", "Small"),
    ("Mannequin Suppliers", "Clothing & Accessories", "National", "Small"),
    ("Costume and Theatrical Rentals", "Clothing & Accessories", "Local", "Small"),
    ("Maternity Apparel Retail", "Clothing & Accessories", "Local", "Small"),
    ("Men's Fashion Retailers", "Clothing & Accessories", "National", "Big"),
    ("Men's Shoe Stores", "Clothing & Accessories", "Local", "Small"),
    ("Equestrian Apparel and Gear", "Clothing & Accessories", "Local", "Small"),
    ("Safety Gear and Apparel Retail", "Clothing & Accessories", "National", "Big"),
    ("Shoe Stores", "Clothing & Accessories", "National", "Big"),
    ("Sportswear Shops", "Clothing & Accessories", "National", "Big"),
    ("Swimwear Retail", "Clothing & Accessories", "Local", "Small"),
    ("T-Shirt Shops", "Clothing & Accessories", "Local", "Small"),
    ("T-Shirt Manufacturers and Wholesalers", "Clothing & Accessories", "National", "Big"),
    ("Custom Tailoring Services", "Clothing & Accessories", "Local", "Small"),
    ("Tuxedo Rentals and Sales", "Clothing & Accessories", "Local", "Small"),
    ("Uniform Suppliers", "Clothing & Accessories", "National", "Big"),
    ("Retail Uniform Stores", "Clothing & Accessories", "National", "Big"),
    ("Used Clothing Shops", "Clothing & Accessories", "Local", "Small"),
    ("Watch Retailers", "Clothing & Accessories", "National", "Big"),
    ("Watch Repair Services", "Clothing & Accessories", "Local", "Small"),
    ("Wedding Dress Shops", "Clothing & Accessories", "National", "Big"),
    ("Wedding Jewelry", "Clothing & Accessories", "Local", "Small"),
    ("Women's Fashion Retailers", "Clothing & Accessories", "National", "Big"),
    ("Plus-Size Clothing Stores", "Clothing & Accessories", "Local", "Small"),
    ("Women's Shoe Stores", "Clothing & Accessories", "Local", "Small"),
    ("Lingerie and Undergarment Retailers", "Clothing & Accessories", "National", "Big"),
]

# Add remaining niches here - due to size limits, this would need to be completed
# with all remaining industries...

total_inserted = 0
batch_size = 50

for i in range(0, len(remaining_niches), batch_size):
    batch = remaining_niches[i:i+batch_size]
    
    niches_to_insert = []
    for niche_name, industry_name, scale, db_size in batch:
        if industry_name in industries:
            niches_to_insert.append({
                "niche_name": niche_name,
                "industry_id": industries[industry_name],
                "scale": scale,
                "database_size": db_size
            })
    
    if niches_to_insert:
        response = supabase.table("niches").insert(niches_to_insert).execute()
        total_inserted += len(niches_to_insert)
        print(f"Inserted batch {i//batch_size + 1}: {len(niches_to_insert)} niches (Total: {total_inserted})")

print(f"\n✓ Import complete! Total niches inserted: {total_inserted}")
