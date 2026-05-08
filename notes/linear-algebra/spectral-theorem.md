---
title: Orthogonality and the Spectral Theorem
course: Linear Algebra
lecture: Lecture 12
lecturer: Dr. Mina Farzan
language: en
dir: ltr
---

# Orthogonality and the Spectral Theorem

The spectral theorem is one of the cleanest bridges between geometry and computation. It says that symmetric matrices are exactly the matrices that can be understood through orthogonal axes.

## Inner products

For vectors \(u,v\in\mathbb{R}^n\), the standard inner product is

$$
\langle u,v\rangle = u^\mathsf{T}v = \sum_{k=1}^{n}u_kv_k.
$$

::: definition
A set of vectors \( \{q_1,\ldots,q_n\} \) is orthonormal if
$$
\langle q_i,q_j\rangle =
\begin{cases}
1, & i=j,\\
0, & i\ne j.
\end{cases}
$$
:::

## Symmetric matrices

::: theorem
If \(A=A^\mathsf{T}\), then \(A\) has an orthonormal basis of eigenvectors. Equivalently, there exists an orthogonal matrix \(Q\) and a diagonal matrix \(\Lambda\) such that
$$
A=Q\Lambda Q^\mathsf{T}.
$$
:::

::: proof
The full proof uses induction and the fact that real symmetric matrices have real eigenvalues. Once an eigenvector \(q_1\) is chosen, the orthogonal complement \(q_1^\perp\) is invariant under \(A\). Applying the induction hypothesis on this smaller subspace gives the desired orthonormal basis.
:::

## Matrix example

$$
A=
\begin{bmatrix}
2 & 1\\
1 & 2
\end{bmatrix},
\qquad
\lambda_1=3,\quad \lambda_2=1.
$$

::: corollary
Every real symmetric matrix is diagonalizable, and its eigenvectors corresponding to distinct eigenvalues are orthogonal.
:::

```js
const isSymmetric = (a) =>
  a.every((row, i) => row.every((value, j) => value === a[j][i]));
```
