function trimDoubleQuotes(str) {
	if (str[0] === '"' && str[str.length - 1] === '"') {
		return str.substring(1, str.length - 1);
	} else {
		return str;
	}
}

function isExpression(str) {
	return str[0] === '{' && str[str.length - 1] === '}';
}

function calcExpression(expression, props, from) {
	const regexDeps = /(\.?[A-Za-z_$][\w$]*)/g;

	if (props.hasOwnProperty(expression)) {
		return props[expression];
	} else {
		let deps = expression.match(regexDeps);
		deps = deps ? deps.filter((depName) => depName[0] !== '.') : [];

		try {
			const calc = new Function(
				...deps,
				`
				return ${expression};
			`
			);
			const calcDeps = deps.map((el) => props[el]);
			return calc(...calcDeps);
		} catch (e) {
			console.warn(`warn: cannot calculate expression: '${expression}' in '${from}'`);
		}
	}
}

// convert {attr} to attr="{attr}"
function unshortAttr(attr) {
	if (!isExpression(attr)) return attr;
	const attrName = attr.substring(1, attr.length - 1);
	return `${attrName}="${attr}"`;
}

function quotesExpression(attr) {
	const regexUnquoted = /([\w-]*)(?::([\w-]*))?={([^>}]*?)}/gis;
	return attr.replace(regexUnquoted, (_, attrName, ternaryAttr, expression) => {
		if (ternaryAttr) {
			return `${attrName}="{${expression} ? '${ternaryAttr}' : ''}"`;
		}
		return `${attrName}="{${expression}}"`;
	});
}

function normalizeAttr(attr) {
	let res = attr;
	res = unshortAttr(res);
	res = quotesExpression(res);
	return res;
}

function parseAttr(attr, props) {
	const regexAttrAll = /([\w-]*)="(.*?)"/gs;
	const regexAttrOne = /([\w-]*)="(.*?)"/s;
	const match = attr.match(regexAttrAll);
	return match
		? match.reduce((result, attr) => {
				let [_, attrName, attrValue] = attr.match(regexAttrOne);
				if (isExpression(attrValue)) {
					const attrCalc = attrValue.substring(1, attrValue.length - 1);
					attrValue = calcExpression(attrCalc, props, 'parse');
				}
				if (result[attrName]) result[attrName] += attrValue;
				else result[attrName] = attrValue;
				return result;
		  }, {})
		: {};
}

module.exports = {
	trimDoubleQuotes,
	normalizeAttr,
	parseAttr,
	calcExpression,
};
