const { exec } = require('child_process');
exec('npm run build', (err, stdout, stderr) => {
    console.log(stdout);
    console.error(stderr);
});
