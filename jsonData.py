import json
import pandas as pd

countries_dict = {}
# countries_list = []
# with open('static/world.json', 'r') as worldfile:
#     data = json.load(worldfile)
#     countries = data["objects"]["subunits"]["geometries"]
#     print(countries)
#     for country in countries:
#         countries_dict[country["properties"]["name"]] = country["id"]
#         countries_list.append(country["properties"]["name"])
#
# print(countries_dict)
# countries_list.sort()
# print(countries_list)

df_fips = pd.read_csv("csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv")
print(df_fips.head())
covid_countries_dict = {}
for index, row in df_fips.iterrows():
    covid_countries_dict[row['Country_Region']] = row['iso3']

print(covid_countries_dict)