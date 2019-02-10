---
title: 'Relational Algebra & SQL'
date: 2019-02-09
permalink: /posts/2019/02/09/relational-algebra
tags:
  - data
  - math
  - SQL
excerpt: ""
---

[Query languages](https://github.com/AnanthaRajuCprojects/List-of-programming-language-lists/blob/master/Query%20language.md) (computer languages used to make queries in databases) are abundant in style and usage today. In 2018, Microsoft released [Azure Data Explorer](https://azure.microsoft.com/en-us/services/data-explorer/) to GA, introducing another query language that is specifically optimized for semi-structured, unstructured, and time-series data. Even though we have many querying language options,  they are all grounded in a field of mathematics called _relational algebra_.

# What is Relational Algebra?

Relational Algebra is an algebra where operands are defined as relations, or variables that represent relations. This is why relational algebra provides the basis for a query language in relational databases.

# The Core Relational Algebra Concepts

## Union $\cup$

Given relations $R$ and $S$, $R \cup S = \\{T \| T \in R \vee T \in S\\}$. In SQL, this is written as

```
SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]

UNION

SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]
```

## Intersection $\cap$

Given relations $R$ and $S$, $R \cap S = \\{T \| T \in R \wedge T \in S\\}$. In SQL, this is written as

```
SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]

INTERSECT

SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]
```

## Difference $\setminus$

Given relations $R$ and $S$, $R \setminus S = \\{T \| T \in R \wedge T \notin S\\}$. In SQL, this is commonly written as

```
SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]

EXCEPT

SELECT column1 [, column2 ]
FROM table1 [, table2 ]
[WHERE condition]
```

However, a `LEFT JOIN` operator can also perform the same functionality.

## Selection $\sigma$

Given relation $R$, $\sigma_{p}(R)$ is selecting typles that satisfy predicate $p = a \theta b$ or $p = a \theta v$ from a relation $R$. $a$ and $b$ are attribute names, $v$ is a value constant, and $\theta$ is a binary operation in $\\{<. \le, =, \neq, \ge, >\\}$. In SQL, this is simply the `WHERE` keyword. Given table `R`:

```
SELECT *
FROM R
[WHERE predicate condition]
```

## Projection $\prod$

Given relation $R$, $\prod_{a_1, ..., a_n}(R)$ is projecting a set obtained when the components of relation $R$ are restricted to the set $\\{a_1, ..., a_n\\}$. In SQL, the `SELECT` operator performs this functionality. Given table `R` with attributes `a`, `b`, `c`

```
SELECT a, b, c
FROM R;
```

_Fun Fact_: the query language from Azure Data Explorer actually has a `project` keyword that behaves exactly like this. Given table `R` with attributes `a`, `b`, `c`:

```
R
| project a, b, c
```

## Products $\times$

Given relations $R$ and $S$, $R \times S = \\{(r,s) \| r \in R and s \in S\\}$. In SQL, this is known as a `CROSS JOIN`:

```
SELECT * 
FROM table1 
CROSS JOIN table2;
```

## Joins

There are several joins we are interested in:

### Natural Join $\Join$

Given relations $R$ and $S$, $R \Join S$ is the set of all combinations of tuples in $R$ and $S$ that are equal on their common attribute names. Formally:

$R \Join S = \\{r \cup s \| r \in R \wedge s \in S \wedge \text{Fun}(r \cup s)\\}$

In SQL, this is known as the `NATURAL JOIN`:

```
SELECT * 
FROM table1 
NATURAL JOIN table2;
```

### Theta Join $\Join_{c}$

Given relations $R$ and $S$, $R \Join_c S$ takes the product $R \times S$, then apply $\sigma_c$ to the result.

## Renaming $\rho$

Given relation $R$, $\rho_{R(a_1, ..., a_n}(R)$ makes the resulting relation be one with attributes $a_1, ..., a_n$ and the same tuples as $R$. In SQL, the `AS` operator allows for remaining of attributes:

```
SELECT a AS apple, b AS banana
FROM R
```