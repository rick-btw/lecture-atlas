---
title: Uniform Convergence and Continuity
course: Mathematical Analysis
lecture: Lecture 8
lecturer: Prof. Daniel Hart
language: en
dir: ltr
---

# Uniform Convergence and Continuity

Uniform convergence controls the error of a sequence of functions on the entire domain at once. This is the point at which pointwise intuition becomes a genuinely analytic tool.

## Pointwise versus uniform convergence

A sequence \( f_n : E \to \mathbb{R} \) converges pointwise to \( f \) if for each fixed \(x \in E\),

$$
\lim_{n\to\infty} f_n(x)=f(x).
$$

It converges uniformly if the same index \(N\) works for every point of the set.

::: definition
We say \( f_n \to f \) uniformly on \(E\) if for every \( \varepsilon > 0 \) there exists \(N\in\mathbb{N}\) such that
$$
n\ge N \quad \Longrightarrow \quad |f_n(x)-f(x)|<\varepsilon
\quad \text{for all } x\in E.
$$
:::

## Preservation of continuity

::: theorem
If each \(f_n\) is continuous on \(E\), and \( f_n \to f \) uniformly on \(E\), then \(f\) is continuous on \(E\).
:::

::: proof
Fix \(x_0\in E\) and let \(\varepsilon>0\). Choose \(N\) so that \( |f_N(x)-f(x)|<\varepsilon/3 \) for all \(x\in E\). Since \(f_N\) is continuous at \(x_0\), choose \(\delta>0\) such that
$$
d(x,x_0)<\delta \Longrightarrow |f_N(x)-f_N(x_0)|<\varepsilon/3.
$$
Then
$$
\begin{aligned}
|f(x)-f(x_0)|
&\le |f(x)-f_N(x)| + |f_N(x)-f_N(x_0)| + |f_N(x_0)-f(x_0)| \\
&< \varepsilon.
\end{aligned}
$$
:::

## A useful criterion

::: lemma
The convergence \( f_n \to f \) is uniform on \(E\) if and only if
$$
\|f_n-f\|_\infty=\sup_{x\in E}|f_n(x)-f(x)| \to 0.
$$
:::

## Example

Consider \( f_n(x)=x^n \) on \([0,1]\). The pointwise limit is

$$
f(x)=
\begin{cases}
0, & 0\le x<1,\\
1, & x=1.
\end{cases}
$$

::: warning
The convergence cannot be uniform on \([0,1]\), because a uniform limit of continuous functions would be continuous, while the pointwise limit has a jump at \(x=1\).
:::

## Reference code

```js
const supError = (fn, f, grid) =>
  Math.max(...grid.map((x) => Math.abs(fn(x) - f(x))));
```
