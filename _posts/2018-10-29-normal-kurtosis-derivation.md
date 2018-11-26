---
title: 'Why is Kurtosis of Standard Normal Distribution 3?'
date: 2018-10-29
permalink: /posts/2018/10/29/normal-kurtosis-derivation
tags:
  - statistics
  - math
excerpt: ""
---

The Kurtosis of a random variable $X$ is the fourth moment of $X$. For a normal distribution, we often see it in the textbook as:


$$
\begin{align}\label{kurt}
	Kurt(X) = E\left[\left(\frac{X-\mu}{\sigma}\right)^4\right] - 3
\end{align}
$$

Here is my textbook's explanation of why we subtract by 3:

> We subtract $3$ to make any Normal distribution have kurtosis $0$.

I've always wondered how $E\left[\left(\frac{X-\mu}{\sigma}\right)^4\right]$ is calculated to be 3. I will attempt to derive this solution. 

## Assumptions

The Normal Distribution has Probability Density Function (PDF):

$$
\begin{align}\label{eq1}
    f(x | \mu, \sigma^2) = \frac{1}{\sqrt{2\pi \sigma^2}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}
\end{align}
$$

We are dealing with standard normal, so mean $\mu = 0$, and variance $\sigma^2 = 1$. We can now write Eq $\ref{eq1}$ as

$$
\begin{align}\label{eq2}
    f(x) = \frac{1}{\sqrt{2\pi}}e^{-\frac{(x)^2}{2}}
\end{align}
$$

We need to find $E\left[\left(\frac{X-\mu}{\sigma}\right)^4\right]$, which can now be written as $E[X^4]$.

## Derivation

<div>
$$
\begin{align*}
    E[X^4] &= \int^{\infty}_{-\infty}x^4 f(x)dx \\
    &= \frac{1}{\sqrt{2\pi}}\int^{\infty}_{-\infty}x^4 e^{-\frac{x^2}{2}}dx \\
\end{align*}
$$
</div>

We will evaluate this integral via [integration by parts](https://www.wikiwand.com/en/Integration_by_parts). Recall that 

<div>
$$
\begin{align*}
    \int udv = uv - \int vdu
\end{align*}
$$
</div>

Let $u = x^3$, $du = 3x^2dx$, $dv = xe^{-\frac{x^2}{2}}dx$, $v = -e^{-\frac{x^2}{2}}$:

<div>
$$
\begin{align*}
    E[X^4] &= \frac{1}{\sqrt{2\pi}}\left(x^3 \left(-e^{-\frac{x^2}{2}}\right) - \int^{\infty}_{-\infty}\left(-e^{-\frac{x^2}{2}}\right)3x^2dx\right) \\
    &= \frac{1}{\sqrt{2\pi}}\left(-x^3e^{-\frac{x^2}{2}} + 3\int_{-\infty}^{\infty}x^2e^{-\frac{x^2}{2}}dx\right)
\end{align*}
$$
</div>

We can begin some evaluations of the terms here. We'll use [L'Hôpital's rule](https://www.wikiwand.com/en/L%27H%C3%B4pital%27s_rule) to evaluate the first term in the parentheses, $-x^3e^{-\frac{x^2}{2}}$. We know that $e^{-\frac{x^2}{2}}$ goes to zero faster than $x^3$ goes to infinity. 

<div>
$$
\begin{align*}
    \lim_{x\to\infty} \frac{-x^3}{e^{\frac{x^2}{2}}} &= \lim_{x\to\infty} \frac{-3x^2}{xe^{\frac{x^2}{2}}} \\
    &= \lim_{x\to\infty} \frac{-6x}{x^2e^{\frac{x^2}{2}}} \\
    &= \lim_{x\to\infty} \frac{-6}{x^3e^{\frac{x^2}{2}}} \\
    &= 0
\end{align*}
$$
</div>

Therefore, this term is $0$. We are now left with:

<div>
$$
\begin{align*}
    E[X^4] &= \frac{1}{\sqrt{2\pi}}\left(3\int_{-\infty}^{\infty}x^2e^{-\frac{x^2}{2}}dx\right) \\
    &= 3\left(\frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}x^2e^{-\frac{x^2}{2}}dx\right)
\end{align*}
$$
</div>

Notice that $\left(\frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}x^2e^{-\frac{x^2}{2}}dx\right)$ is actually the second moment $E[X^2]$, or as we know it, the _variance_ of the standard normal distribution. You may recognize $Var(X) = E[X^2] - [EX]^2$, with the second term being the mean ($\mu$) squared. For a standard normal distribution, with $\mu = 0$, $Var(x) = E[X^2]$. Additionally, we know that for a standard normal, the variance $\sigma^2 = 1$. Therefore:

<div>
$$
\begin{align*}
    E[X^4] &= 3\left(\frac{1}{\sqrt{2\pi}}\int_{-\infty}^{\infty}x^2e^{-\frac{x^2}{2}}dx\right) \\
    &= 3 \cdot E[X^2] \\
    &= 3 \cdot Var(X) \\
    &= 3 \cdot (1) \\
    &= 3
\end{align*}
$$
</div>

$E[X^4]$ is shown to be 3, and we are now done. As a sanity check, we can use R to do a Monte Carlo simulation of a standard normal distribution and calculate the kurtosis:

```R
# Standard Normal Distribution
set.seed(123)
n.sample <- rnorm(n = 100000, mean = 0, sd = 1)

# Kurtosis
library(moments)
kurtosis(n.sample) # we get 2.990068
```

Close enough! $\blacksquare$