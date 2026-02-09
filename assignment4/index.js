const express = require('express');
const app = express();
const port = process.env.PORT || 8000;


const users = [
	{ id: 1, name: 'Alice' },
	{ id: 2, name: 'Bob' },
	{ id: 3, name: 'Charlie' },
	{ id: 4, name: 'David' },
	{ id: 5, name: 'Alicia' }
];

app.get('/users', (req, res) => {
	const { name } = req.query;
	let result = users;

	if (name) {
		const q = String(name).toLowerCase();
		result = users.filter(u => u.name.toLowerCase().includes(q));
	}

	res.json(result);
});

app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});

