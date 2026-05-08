---
title: Limits, Continuity, and the Derivative
course: Calculus I
lecture: Lecture 1
lecturer: Dr. Sarah Bennett
language: en
dir: ltr
---

# Limits, Continuity, and the Derivative

Calculus begins with the study of local behavior. A limit asks what a quantity approaches, while the derivative measures the best linear approximation near a point.

## Limits

::: definition
We write \( \lim_{x\to a} f(x)=L \) if for every \( \varepsilon>0 \) there exists \( \delta>0 \) such that
$$
0<|x-a|<\delta \quad \Longrightarrow \quad |f(x)-L|<\varepsilon.
$$
:::

## Continuity

::: theorem
A function \(f\) is continuous at \(a\) if and only if
$$
\lim_{x\to a} f(x)=f(a).
$$
:::

::: example
For \(f(x)=x^2\), we have
$$
\lim_{x\to 3} x^2=9=f(3),
$$
so \(f\) is continuous at \(3\).
:::

## Derivative

The derivative is defined by the limit of difference quotients:

$$
f'(a)=\lim_{h\to 0}\frac{f(a+h)-f(a)}{h}.
$$

For \(f(x)=x^2\),

$$
\begin{aligned}
f'(a)
&=\lim_{h\to 0}\frac{(a+h)^2-a^2}{h}\\
&=\lim_{h\to 0}(2a+h)\\
&=2a.
\end{aligned}
$$

::: exercise
Use the definition of the derivative to compute \( \frac{d}{dx}x^3 \). Keep the terms involving \(h\) until the final limit.
:::
