# Quadratic Functions

Quadratic functions are polynomial functions of degree 2. They create parabolic curves when graphed and appear frequently in physics, engineering, and economics.

## Standard Form

The standard form of a quadratic function is:

$$f(x) = ax^2 + bx + c$$

Where:
- $a \neq 0$ (coefficient of $x^2$)
- $b$ is the coefficient of $x$
- $c$ is the constant term

## Key Features of Parabolas

### Vertex

The vertex is the highest or lowest point of the parabola:
- **Vertex formula**: $x = -\frac{b}{2a}$
- Substitute back to find $y$-coordinate

### Axis of Symmetry

The vertical line through the vertex: $x = -\frac{b}{2a}$

### Direction

- If $a > 0$: parabola opens upward (minimum at vertex)
- If $a < 0$: parabola opens downward (maximum at vertex)

## Example: Analyzing a Quadratic Function

Consider: $f(x) = 2x^2 - 8x + 3$

**Find the vertex**:
$$x = -\frac{b}{2a} = -\frac{(-8)}{2(2)} = \frac{8}{4} = 2$$

$$f(2) = 2(2)^2 - 8(2) + 3 = 8 - 16 + 3 = -5$$

**Vertex**: $(2, -5)$

**Since $a = 2 > 0$**, the parabola opens upward with a minimum at $(2, -5)$.

## Solving Quadratic Equations

### Method 1: Factoring

For $x^2 + 5x + 6 = 0$:

Factor: $(x + 2)(x + 3) = 0$

Solutions: $x = -2$ or $x = -3$

### Method 2: Quadratic Formula

For any quadratic equation $ax^2 + bx + c = 0$:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

### Method 3: Completing the Square

Transform $ax^2 + bx + c = 0$ into $(x - h)^2 = k$ form.

## The Discriminant

The discriminant $\Delta = b^2 - 4ac$ tells us about the solutions:

- $\Delta > 0$: Two real solutions
- $\Delta = 0$: One real solution (repeated root)
- $\Delta < 0$: No real solutions (complex solutions)

## Applications

### Projectile Motion

The height of a projectile: $h(t) = -16t^2 + v_0t + h_0$

Where:
- $t$ is time
- $v_0$ is initial velocity
- $h_0$ is initial height

### Optimization Problems

**Example**: A farmer has 100 feet of fencing. What dimensions maximize the area of a rectangular pen?

Let $x$ = width, then length = $50 - x$

Area: $A(x) = x(50 - x) = 50x - x^2$

This is a quadratic with maximum at $x = 25$ feet.

### Revenue and Profit

If price $p$ and demand $q$ are related by $p = 100 - 2q$:

Revenue: $R(q) = pq = q(100 - 2q) = 100q - 2q^2$

## Transformations

Starting with $f(x) = x^2$:

- $f(x) + k$: vertical shift by $k$
- $f(x - h)$: horizontal shift by $h$
- $af(x)$: vertical stretch by factor $|a|$
- $f(ax)$: horizontal compression by factor $\frac{1}{|a|}$

## Practice Problems

1. Find the vertex of $f(x) = x^2 - 6x + 8$
2. Solve $2x^2 + 7x - 4 = 0$ using the quadratic formula
3. A ball is thrown upward with initial velocity 48 ft/s from height 6 ft. When does it hit the ground?
4. Find the maximum revenue if $R(x) = -2x^2 + 100x$

---

*Next: We'll explore polynomials of higher degrees and their properties.*
