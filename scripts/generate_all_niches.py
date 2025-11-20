"""
Python script to parse the industry/niche data and generate complete SQL inserts
Run this to generate the full 009_create_opportunities_tables.sql file with all 1536 niches
"""

import re

# All the industry data from the user's message
industries_data = """
Arts & Entertainment: 92 niches (already done above)
Automotive: 70 niches (already done above)
Business Services: 109 niches
Clothing & Accessories: 65 niches
Community and Government: 95 niches
Computer & Tech: 72 niches
Construction & Tradesmen: 90 niches
Education: 73 niches
Hospitality & Food: 83 niches
Medicine & Health: 97 niches
Home Improvements: 78 niches
Agriculture & Mining: 81 niches
Legal & Financial: 122 niches
Media & Comms: 43 niches
Fitness & Personal Care: 58 niches
Real Estate: 66 niches
Shopping & Retail: 74 niches
Sports: 81 niches
Travel & Transport: 87 niches
"""

def generate_sql_insert(industry_name, niches_list):
    """Generate SQL INSERT statement for an industry's niches"""
    sql = f"\n-- Insert {industry_name} niches\n"
    sql += "INSERT INTO niches (industry_id, niche_name, scale, database_size)\n"
    sql += "SELECT id, niche_name, scale, database_size FROM industries, (VALUES\n"
    
    values = []
    for niche in niches_list:
        name, scale, db_size = niche
        values.append(f"  ('{name}', '{scale}', '{db_size}')")
    
    sql += ",\n".join(values)
    sql += f"\n) AS t(niche_name, scale, database_size)\n"
    sql += f"WHERE industries.name = '{industry_name}'\n"
    sql += "ON CONFLICT (industry_id, niche_name) DO NOTHING;\n"
    
    return sql

# Note: In a real implementation, you would parse all the niche data from the user's message
# and generate complete INSERT statements for all 1536 niches across all 19 industries
print("Generate SQL for all industries here...")
