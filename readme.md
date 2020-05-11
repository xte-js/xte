# XTE - next template engine

Based on htmlx (svelte template syntax)

## Syntax

all as html, except tags, started with capital letters like `<Footer>`

## Control Structures

Conditional rendering

```
{#if condition}
	...
{:else if condition}
	...
{/if}
```

Iterate rendering

```
{#each array-like as element, index}
	...
{:else}
	...
{/each}
```

## xte.cfg.js

Define input file and props

## TODO:

Indent fix in `if` and `each`
Scoped css
Rebuild css to one file
