import('./app.js').then(()=>console.log('APP OK')).catch(e=>console.error('APP ERR', e.stack));
