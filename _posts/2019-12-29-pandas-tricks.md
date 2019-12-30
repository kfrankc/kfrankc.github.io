---
title: 'Pandas Tips & Tricks'
date: 2019-12-29
permalink: /posts/2019/12/29/pandas-tricks
tags:
  - python
  - data science
excerpt: ""
layout: single
toc: true
---

{% include figure image_path="https://pandas.pydata.org/_static/pandas_logo.png" alt="" caption="Pandas is an open source Python library providing data analysis toolsImage credit: [Pandas](https://pandas.pydata.org/_static/pandas_logo.png)" %}

## Background

Pandas is a comprehensive Python library for data analysis, but its syntax for performing certain specific data transformations can be difficult to discern from its documentation. I recently used Pandas in my [analysis of Billboard Top 100 Music data](https://kfrankc.com/portfolio/billboard/)), and I've uncovered several useful Pandas commands that I will most likely use again in the future, so I'm compiling a (growing) list here for both my own reference and the benefit of someone else struggling with these problems in the future.

I will be updating this as I come across/learn new useful methods.

## (Growing) List of Useful Tips

**Note:** assume `import pandas as pd` below:

### Datetime Manipulation

Many datasets contain a `datetime` field of some sort, following patterns such as `mm/dd/yyyy`, `dd/mm/yyyy`, `mm-dd-yyyy` etc. It is often useful to separate this single column into the respective month, day, and year. For example, if we have a Pandas dataframe with the following `WeekID` field that follows `mm/dd/yyyy`: `2/10/1999', we can use the following Pandas code:

```python
# use to_datetime to separate one column into multiple
data['WeekID'] = pd.to_datetime(data['WeekID'], format='%m/%d/%Y')
# extract the year, month, and day into separate columns
data['year'] = data['WeekID'].dt.year
data['month'] = data['WeekID'].dt.month
data['day'] = data['WeekID'].dt.day
```

Similarly, `/` can be replaced in the format variable with `-` if that's the syntax for the datetime pattern.

### Row Selections

Rows can be selected based on logical comparisons:

```python
# return all the rows where 'year' is 2018 or 2017
data = data.loc[(data['year'] == 2018) | (data['year'] == 2017)]
```

For `datetime`, can also be achieved using masks:

```python
# isolate dates to between Dec. 1, 2017 and May 31, 2018
data['datetime'] = pd.to_datetime(data['datetime'])
mask = (data['datetime'] > '2017-12-01') & (data['datetime'] <= '2018-05-31')
data = data.loc[mask]
```

### Map

Append additional information to every entry in a column using `map`:

```python
# add month and year to id column
data['id'] = data.id.map(str) + "-" + data.Month.map(str) +"-" + data.Year.map(str)
```

### Pivot Tables

Pivot tables summarize data of more extensive tables using sums, aggregations, averages, or other statistics. They are useful in business intelligence and data analysis.

Say we have a dataframe `data` with columns `position` (between values `1` and `100`) and `id`; I want a new table that displays, for each `id` entry, the counts for each `position` value. Pivot tables can be defined and performed in Pandas as follows:

```python
# use pivot table to extract counts of position per id
data['count'] = 1
result = data.pivot_table(
    index=['id'], columns='position', values='count',
    fill_value=0, aggfunc=np.sum
)
```

### Merge on `str.contains()` instead of 1-to-1 match

I came across this particular problem when trying to merge two datasets together via partial matching. For example, I have dataframes `data1` and `data2`. `data1` has entries in `id` column that could be a substring of `data2`'s `id` column entries. Merges based on partial matches can be implemented as follows:

```python
# join based on partial matches of data1's id with data2's id
tmp = (data1.id
          .apply(lambda idx: data2[data2.id.str.find(idx).ge(0)]['id'])
          .bfill(axis=1)
          .iloc[:, 0])
result = pd.concat([data1.id, tmp], axis=1, ignore_index=True).rename(columns={0: 'id1', 1: 'id2'})
```

### Sorting

Often it is useful to keep one max/min row after sorting on a column. In Pandas, this can be done in a line:

```python
data = data.sort_values('position').drop_duplicates(["id"],keep='last')
```

Furthermore, sorting on two or more columns by order is also possible in a line:

```python
# sort on position first from largest to smallest, then on id from smallest to largest
data.sort_values(['position', 'id'], ascending=[False, True])
```
