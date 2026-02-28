import express from 'express';
console.log('Express loaded');
const app = express();
console.log('App created');
app.use((req, res) => res.send('ok'));
console.log('Route added');
app.listen(3001, () => {
    console.log('Test server listening on 3001');
    process.exit(0);
});
