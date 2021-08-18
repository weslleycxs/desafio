global.io = null;

module.exports = {

    // @todo Mover para uma área melhor
    loggedUsers: {},

    setup(io){

        global.io = io;

        global.modules.module.getComponentStack('socket-middleware').forEach(socketComponent => {

            io.use(socketComponent);

        });

        io.on('connection', socket => {

            socket.on('login', (jwt, callback) => {

                console.log('Login de socket');

                global.modules.module.getComponentStack('socket-con').forEach(socketComponent => {

                    socketComponent(socket);

                });

                if(typeof callback === 'undefined') callback = function(){};

                socket.emit('checksum', global.helpers.vars.checksum);

                global.helpers.jwt.verify(jwt).then(decoded => {

                    socket.decoded = decoded;

                    Users.setLastLogin(decoded.mail);

                    socket.join('logged');
                    socket.join('user_' + decoded.id);

                    callback();

                });

            });

        })

    }

}