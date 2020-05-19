# Import required packages
import pandas as pd
from sklearn import decomposition
from sklearn import manifold
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances

import json
from flask import Flask, render_template, request
import numpy as np
import random

import matplotlib.pyplot as plt

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

df_confirmed['Total'] = df_confirmed.iloc[:, 1:].sum(axis=1)
df_deaths['Total'] = df_deaths.iloc[:, 1:].sum(axis=1)
df_recovered['Total'] = df_recovered.iloc[:, 1:].sum(axis=1)

df_daily = pd.read_csv('csse_covid_19_data/csse_covid_19_daily_reports/05-17-2020.csv')
columns_to_be_removed = ["FIPS", "Admin2", "Province_State", "Last_Update", "Lat", "Long_", "Combined_Key"]
df_daily = df_daily.drop(columns_to_be_removed, axis= 1)
df_daily = df_daily.groupby(['Country_Region']).sum()

df_complete_sum = df_daily.sum(axis = 0)

def getDateWiseDataForLinePlot(columnName):
   dates = df_confirmed.index
   confirmed = df_confirmed[columnName]
   deaths = df_deaths[columnName]
   recovered = df_recovered[columnName]
   data = []
   for i in range(len(dates)):
      data.append({"date": dates[i], "confirmed": confirmed[i], "deaths": deaths[i], "recovered": recovered[i]})
   return data


def get_pie_chart_data(country):
   confirmed = df_confirmed[country].iloc[-1]
   deaths = df_deaths[country].iloc[-1]
   recovered = df_recovered[country].iloc[-1]
   active = confirmed - (deaths + recovered)
   #{"Confirmed":4713620,"Deaths":315185,"Recovered":1733963,"Active":2661908}
   return {"Confirmed": confirmed, "Deaths": deaths, "Recovered": recovered, "Active": active}


def parallel_coordinateData():
   #taking top 20 countries for parallel coordinates
   df_top_20 = df_daily
   df_top_20.sort_values(by=['Confirmed'], inplace=True, ascending=False)
   cols = ["Confirmed", "Active", "Recovered", "Deaths"]
   df_top_20 = df_top_20[cols]
   df_top_20 = df_top_20.head(20)
   df_top_20 = df_top_20.drop("US")
   print(df_top_20)
   top_20_countries_list = []

   for index, row in df_top_20.iterrows():
      country_json = {}
      country_json["Country"] = index
      country_json["Confirmed"] = row["Confirmed"]
      country_json["Active"] = row["Active"]
      country_json["Recovered"] = row["Recovered"]
      country_json["Deaths"] = row["Deaths"]
      top_20_countries_list.append(country_json)

   # print(top_20_countries_list)
   return top_20_countries_list

def getDataForMap(type):
   #for map
   df_fips = pd.read_csv("csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv")
   covid_countries_dict = {}
   for index, row in df_fips.iterrows():
       covid_countries_dict[row['Country_Region']] = row['iso3']
   countries_list = covid_countries_dict.keys()
   cases_list = []
   for index, row in df_daily.iterrows():
      cases_list.append({"key": str(covid_countries_dict[index]), "doc_count": row[type]})
   return cases_list

def bar_chart_data():
   df_age_data = pd.read_csv("csse_covid_19_data/age_deaths_data.csv")
   data = []
   for index, row in df_age_data.iterrows():
       data.append({"Age": row["Age"], "Number_of_Deaths": row["Number of Deaths"]})
   return data



line_plot_data = getDateWiseDataForLinePlot("Total")
pie_chart_data = get_pie_chart_data("Total")
map_data = getDataForMap("Confirmed")
parallelcoordinates_data = parallel_coordinateData()
barchart_data = bar_chart_data()

columns_in_map = ["Confirmed", "Deaths", "Active"]

world_json_data = json.load(open("static/world.json"))
data = {
   "took": 492,
   "timed_out": "false",
   "_shards": {
      "total": 5,
      "successful": 3,
      "failed": 0
   },
   "hits": {
      "total": 30111166,
      "max_score": 0,
      "hits": []
   },
   "aggregations": {
      "world_map": {
         "doc_count_error_upper_bound": 0,
         "sum_other_doc_count": 0
      }
   }
}
data["aggregations"]["world_map"]["buckets"] = map_data

app = Flask(__name__)
# By default, a route only answers to GET requests. You can use the methods argument of the route() decorator to handle different HTTP methods.
@app.route("/", methods=['POST', 'GET'])
def index():
    return render_template("index.html", mockdata = data, worldJSON = world_json_data, parallelcoordinates = parallelcoordinates_data,
                           piechartdata = pie_chart_data, lineplotdata = line_plot_data, barchartdata = barchart_data, columns = columns_in_map)


@app.route("/mapclick", methods=['POST', 'GET'])
def onclickofmap():
    global parallelcoordinates_data
    global barchart_data
    global data

    print(request.args.get('countryname'))
    clicked_country = request.args.get('countryname')

    line_plot_data = getDateWiseDataForLinePlot(clicked_country)
    pie_chart_data = get_pie_chart_data(clicked_country)

    return render_template("body-html.html", mockdata = data, worldJSON = json.load(open("static/world.json")), parallelcoordinates = parallelcoordinates_data,
                           piechartdata = pie_chart_data, lineplotdata = line_plot_data, barchartdata = barchart_data, columns = columns_in_map)

@app.route("/updatemap", methods=['POST', 'GET'])
def updateMap():
    global parallelcoordinates_data
    global pie_chart_data
    global line_plot_data
    global barchart_data
    global data
    columns_in_map = ["Confirmed", "Deaths", "Active"]

    print(request.args.get('selected_column'))
    selected_column = request.args.get('selected_column')

    map_data = getDataForMap(selected_column)
    data["aggregations"]["world_map"]["buckets"] = map_data

    columns_in_map.remove(selected_column)
    columns_in_map.insert(0, selected_column)

    return render_template("body-html.html", mockdata = data, worldJSON = json.load(open("static/world.json")), parallelcoordinates = parallelcoordinates_data,
                           piechartdata = pie_chart_data, lineplotdata = line_plot_data, barchartdata = barchart_data, columns = columns_in_map)


if __name__ == "__main__":
    app.run(debug=True)