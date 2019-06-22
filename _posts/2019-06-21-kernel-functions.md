---
title: 'Kernel Functions'
date: 2019-06-21
permalink: /posts/2019/06/21/kernel-functions
tags:
  - machine learning
  - math
excerpt: ""
layout: single
toc: true
header:
---

{% include figure image_path="/assets/images/blog/kernel_illustration.png" alt="" caption="Kernel functions transform linearly inseparable data (left) to linearly separable ones (right). Image credit: [jakevdp](https://jakevdp.github.io/PythonDataScienceHandbook/05.07-support-vector-machines.html)" %}

## Background

In a typical introductory machine learning class, students generally learn the classifiers first (ex. Nearest Neighbor, Decision Trees, Naive Bayes). However, the methods to reduce computational cost and optimize dimensionality are just as important, especially when students begin dealing with real-world datasets that are in high dimensions. Kernel functions are one method to reduce computational cost and complexity.

## Kernel Functions

Intuitively, kernel functions can be interpreted as similarity measures. A kernel function takes two input from a set $\mathcal{X}$, and outputs a real number $\in \mathbb{R}$.

Mathematically, kernel functions allow you to compute the dot product of two vectors $\textbf{x}$ and $\textbf{y}$ in a high dimensional feature space, without requiring you to know that feature space at all. This aligns with what we said about reducing computational cost, since you don't need to visit a higher dimensional space to perform the granular calculations if you choose a good kernel.

Oftentimes in classification problems, we are attemping to build a classifier that can linearly separate the data (see header image example). If our provided dataset is not linearly separable, we can first apply a nonlinear function $\phi$ to the data, then fit a linear classifier on the transformed data. Since we are using kernels, we can evaluate inner products only, and avoid stepping into the $\phi$ space for computation.

### Connection between Kernel Functions & Learning Algorithms

If we know an algorithm relies only on the inner product between features (ex. ridge regression, SVMs, k-means), then we can kernalize the data.

## Examples of Kernel Functions

### Polynomial Kernel

$$
k(x_i, x_j) = (x_i \cdot x_j + 1)^d
$$

where $d$ is the degree of the polynomial. This type of kernel represents the similarity of vectors in a feature space over polynomials of the original variables. It is popular in natural language processing.

### Gaussian Kernel

$$
k(x, y) = \text{exp}\left(-\frac{\|x - y\|^2}{2\sigma^2}\right)
$$

This type of kernel is useful when there is no prior knowledge about the data; it has good performance when there is the assumption og general smoothness of the data. It is an example of the radial basis function kernel (below). $\sigma$ is the regularization variable that can be tuned specifically for each problem.

### Gaussian Radial Basis Function (RBF)

$$
k(x_i, x_j) = \text{exp}(-\gamma \|x_i - x_j\|^2)
$$

for $\gamma > 0$. The difference between this kernel and the gaussian kernel is the amount of regularization applied.

## Exponential Kernel

$$
k(x, y) = text{exp}\left(-\frac{\|x - y\|}{2\sigma^2}\right)
$$

### Laplace RBF Kernel

$$
k(x, y) = \text{exp}\left(-\frac{\|x - y\|}{\sigma}\right)
$$

This type of kernel is completely equivalent to the exponential kernel, but it is less sensitive to change in the $\sigma$ regularization variable.

### Hyperbolic Tangent (Sigmoid) Kernel

$$
k(x, y) = \text{tanh}(\alpha x^Ty + c)
$$

This type of kernel is useful in neural networks, and is also known as the Multilayer Perceptron (MLP) kernel.
