return {
	input: 'main-menu.xte',
	output: 'index.html',
	data: {
		title: 'Title from config',
		isMainPage: true,
		class: 'main-class',
		cards: [
			{ title: 'card 1', child: [{ name: 'name 1' }, { name: 'name 2' }, { name: 'name 3' }] },
			{ title: 'card 2', child: [{ name: 'name 4' }, { name: 'name 5' }, { name: 'name 6' }] },
			{ title: 'card 3', child: [{ name: 'name 7' }, { name: 'name 8' }, { name: 'name 9' }] },
		],
	},
};
