---
title: 'Kernel Functions & SVMs'
date: 2019-06-21
permalink: /posts/2019/06/21/kernel-functions-svm
tags:
  - machine learning
  - statistics
  - math
excerpt: ""
layout: single
toc: true
header:
---

{% include figure image_path="/assets/images/blog/kernel_illustration.png" alt="" caption="Kernel functions transform linearly inseparable data (left) to linearly separable ones (right). Image credit: [jakevdp](https://jakevdp.github.io/PythonDataScienceHandbook/05.07-support-vector-machines.html)" %}

## Background

In a typical introductory machine learning class, students generally learn the classifiers first (ex. Nearest Neighbor, Decision Trees, Naive Bayes). However, the methods to reduce computational cost and optimize dimensionality are just as important, especially when students begin dealing with real-world datasets that are in high dimensions. Kernel functions are one method to reduce computational cost and complexity. Additionally, many machine learning algorithms (ex. SVMs) can be enhanced by using kernels, so it is beneficial to understand how they work.

## Kernel Functions

Kernel functions can be interpreted as similarity measures between two entities. A kernel function takes two input from a set $\mathcal{X}$, and outputs a real number $\in \mathbb{R}$.

Mathematically, kernel functions allow you to compute the dot product of two vectors $\textbf{x}$ and $\textbf{y}$ in a high dimensional feature space, without requiring you to know that feature space at all. This aligns with what we said about reducing computational cost, since you don't need to visit a higher dimensional space to perform the granular calculations if you choose a good kernel.

Oftentimes in classification problems, we are attemping to build a classifier that can linearly separate the data (see header image example). If our provided dataset is not linearly separable, we can first apply a nonlinear function $\phi$ to the data, then fit a linear classifier on the transformed data. Since we are using kernels, we can evaluate inner products only, and avoid stepping into the $\phi$ space for computation.

### Connection between Kernel Functions & Learning Algorithms

If we know an algorithm relies only on the inner product between features (ex. ridge regression, SVMs, k-means), then we can _kernalize_ the data. Since many algorithms involve inner products, kernels become an essential part in the machine learning pipeline.

## Kernel Support Vector Machines

Kernel functions are especially useful in SVMs, since it will allow us to project our data into a dimension of our choosing, without the complexity of building the full dimensional representation of the kernel transformation. This is achieved using the [kernel trick](https://www.wikiwand.com/en/Kernel_method).

Suppose we have inputs $x_1,\dots, x_n\in\mathbb{R}^d$ and corresponding labels $y_1,\dots, y_n\in\{-1, +1\}$. For linear SVM with squared [hinge loss](https://www.wikiwand.com/en/Hinge_loss), we have:

$$
\min_{w\in\mathbb{R}^d} \frac{1}{n}\sum_{i=1}^n \left\{\max\left(0, 1-y_iw^Tx_i\right)\right\}^2 + \lambda\|w\|^2_2
$$

Letting $\beta=(\beta_1, \dots, \beta_n)^T$ and $K_i=(K(x_1, x_i),K(x_2,x_i),\dots, K(x_n,x_i))^T$, the kernelized version of the above objective becomes:

$$
\min_{\beta\in\mathbb{R}^n} F(\beta) = \frac{1}{n}\sum_{i=1}^n \left\{\max\left(0, 1-y_i\beta^TK_i\right)\right\}^2 + \lambda \beta^TK\beta
$$

where $K \in \mathbb{R}^{n \times n}$ is the [Gram matrix](https://www.wikiwand.com/en/Gramian_matrix). Now, we can optimize $\beta$, usually by running gradient descent. The gradient can be calculated using chain rule:

$$
\nabla F(\beta) = -\frac{2}{n}\sum_{i=1}^n \left\{\max\left(0, 1-y_i\beta^TK_i\right)\right\}yK + 2\lambda K\beta
$$


There are many different types of kernel functions that can be used to compute $K$. Below are a few of the common ones:

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

### Exponential Kernel

$$
k(x, y) = \text{exp}\left(-\frac{\|x - y\|}{2\sigma^2}\right)
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
