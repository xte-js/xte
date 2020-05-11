const { trimDoubleQuotes, normalizeAttr, parseAttr, calcExpression } = require('./strings');
const { readFile } = require('./files');

function renderBlock(body, props, children, from) {
	let parsed = body;
	const regexProps = /{(.*?)}/gs;
	const regexIf = /{#if\s(.+?)}(.*?)({:else}(.*?))?{\/if}/gs;
	const regexEach = /{#each\s(.+?)}(.*?)({:else}(.*?))?{\/each}/gs;
	const regexSlot = /<slot><\/slot>/gs;

	//render if
	parsed = parsed.replace(regexIf, (match, condition, ifBlock, _, elseBlock) => {
		return calcExpression(condition, props, from) ? ifBlock : elseBlock || '';
	});

	//render each
	parsed = parsed.replace(regexEach, (match, iterator, eachBlock, _, elseBlock) => {
		const [arrayName, locals] = iterator.split('as').map((str) => str.trim());
		const [element, index] = locals.split(',').map((str) => str.trim());
		const arrayExpression = calcExpression(arrayName, props, from);
		if (arrayExpression === undefined || arrayExpression === null) {
			console.error(` err: cannot parse '${arrayName}' as array in '${from}'`);
			process.exit(1);
		}
		const array = Array.from(arrayExpression);
		let result = array.length
			? array
					.map((el, idx) => {
						let localScope = {
							...props,
							[element]: el,
							[index]: idx,
						};
						return renderBlock(eachBlock, localScope, children, from);
					})
					.join('\n')
			: elseBlock;
		return result;
	});

	//render Children
	parsed = renderChildren(parsed, props, children, from);

	// render expressions
	parsed = parsed.replace(regexProps, (_, expression) => {
		return calcExpression(expression, props, from);
	});

	parsed = parsed.replace(regexSlot, (_) => {
		return props.$$slot || '';
	});

	return parsed;
}

function renderChildren(body, props, children, from) {
	const regexChild = /<([A-Z][\w-]*)\s([^>]*)>(.*?)<\/\1>/gs;
	const parsed = body.replace(regexChild, (_, tag, attrs, slot) => {
		const localScope = {
			...props,
			$$slot: slot,
			...parseAttr(attrs, props),
		};
		return children[tag].render(localScope);
	});
	return parsed;
}

class Component {
	constructor(name, text) {
		this.name = name;
		this.body = text;
		this.parsed = text;
		this.defined = [];
		this.used = [];
		return this.getDefinedComponents()
			.getUsedComponents()
			.initialParse()
			.checkChildrenComponents()
			.createChildrenComponents();
	}

	getDefinedComponents() {
		const regexDefineAll = /{#def\s(.*?)\/?}\s*/gis;
		const regexDefineOne = /{#def\s(.*?)\/?}/is;

		const match = this.body.match(regexDefineAll);
		if (match) {
			this.defined = match.reduce((result, component) => {
				let [name, file] = component.match(regexDefineOne)[1].split('=');
				name = name.trim();
				if (!file) {
					file = `${name}.xte`;
				}
				file = trimDoubleQuotes(file.trim());
				if (result[name]) {
					console.warn(`warn: component '${child}' already defined in '${this.name}'`);
				}
				return {
					...result,
					[name]: file,
				};
			}, {});
			this.parsed = this.parsed.replace(regexDefineAll, '');
		}
		return this;
	}

	getUsedComponents() {
		const regexUsedAll = /<([A-Z][\w-]*?)[\s\/>]/gs;
		const regexUsedOne = /<([A-Z][\w-]*?)[\s\/>]/s;

		const match = this.body.match(regexUsedAll);
		if (match) {
			this.used = match.map((component) => {
				return component.match(regexUsedOne)[1];
			});
		}
		return this;
	}

	checkChildrenComponents() {
		const def = Object.keys(this.defined);
		def.forEach((child) => {
			if (!this.used.includes(child)) {
				console.warn(`warn: component '${child}' defined in '${this.name}', but not used.`);
			}
		});
		this.used.forEach((child) => {
			if (!def.includes(child)) {
				const { body, parsed, ...rest } = this;
				console.error(`err:  component '${child}' not defined in '${this.name}'`);
				process.exit(1);
			}
		});
		return this;
	}

	createChildrenComponents() {
		this.children = this.used.reduce((result, name) => {
			const filename = this.defined[name];
			result[name] = new Component(filename, readFile(filename, this.name));
			return result;
		}, {});
		return this;
	}

	initialParse() {
		const regexSelfClosed = /<(([A-Z][a-z]*)\s?[^>]*)\/>/gs;
		const regexTagAttr = /<([A-Z][\w-]*)\s([^>]*)>/gs;
		// const regexTagAttr = /<[\w-]*\s([^>]*)>/gs;
		const regexAttrList = /([\S]*?=?(".*?"|'.*?'))|[\S]*/gs;

		//close selfclosed components with another tag
		this.parsed = this.parsed.replace(regexSelfClosed, (_, full, tag) => {
			return `<${full}></${tag}>`;
		});

		//redo props and attributes
		this.parsed = this.parsed.replace(regexTagAttr, (_, tag, propsString) => {
			const shortCuts = propsString.match(regexAttrList).filter((str) => str.length);
			const parsedCuts = shortCuts ? shortCuts.map((el) => normalizeAttr(el)) : [];
			return `<${tag} ${parsedCuts.join(' ')}>`;
		});
		return this;
	}

	render(props) {
		return renderBlock(this.parsed, props, this.children, this.name);
	}
}

module.exports = {
	Component,
};
