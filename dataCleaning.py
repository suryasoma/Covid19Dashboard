import pandas as pd

df_confirmed = pd.read_csv('csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
df_deaths = pd.read_csv('csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv')
df_recovered = pd.read_csv('csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv')
columns_to_be_removed = ['Province/State', 'Lat', 'Long']

df_confirmed = df_confirmed.drop(columns_to_be_removed, axis= 1)
df_deaths = df_deaths.drop(columns_to_be_removed, axis= 1)
df_recovered = df_recovered.drop(columns_to_be_removed, axis= 1)

df_confirmed = df_confirmed.groupby(['Country/Region']).sum()
df_deaths = df_deaths.groupby(['Country/Region']).sum()
df_recovered = df_recovered.groupby(['Country/Region']).sum()

df_confirmed = df_confirmed.T
df_deaths = df_deaths.T
df_recovered = df_recovered.T

# print(df_confirmed["US"])
# print(df_deaths["US"])
# print(df_recovered["US"])

df_daily = pd.read_csv('csse_covid_19_data/csse_covid_19_daily_reports/05-17-2020.csv')
columns_to_be_removed = ["FIPS", "Admin2", "Province_State", "Last_Update", "Lat", "Long_", "Combined_Key"]
df_daily = df_daily.drop(columns_to_be_removed, axis= 1)
df_daily = df_daily.groupby(['Country_Region']).sum()
# print(df_daily)
df_daily.sort_values(by=['Confirmed'], inplace=True, ascending=False)
# print(df_daily)
cols = ["Confirmed", "Active", "Recovered", "Deaths"]
df_daily = df_daily[cols]
df_top_20 = df_daily.head(20)
df_top_20.to_csv("static/daily20.csv")
df_daily = df_daily.T
# df_daily.to_csv("static/daily.csv")
# print(df_daily["US"])

