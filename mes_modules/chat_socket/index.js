let socketio = require('socket.io')

module.exports.listen = function(server){
    let io = socketio.listen(server)

    // ------------------------------ Traitement du socket
    let objUtilisateur = {}
    io.on('connection', function(socket){
	    console.log(socket.id)
	    socket.on('setUser', function(data) {
	    	objUtilisateur[socket.id] = data.user;
	    	//console.log('objUtilisateur = ' + util.inspect(objUtilisateur))
	    	//console.log(util.inspect(data))
	    	socket.emit('valide_user', data);
	    	io.sockets.emit('diffuser_list_user', objUtilisateur);
	    })

	    socket.on('sendMessage', function(data) {
	    	//objUtilisateur[socket.id] = data.user;
	    	//console.log('objUtilisateur = ' + util.inspect(objUtilisateur))
	    	//console.log(util.inspect(data))
	    	socket.broadcast.emit('message', data);
	    	socket.emit('valide_message', data);
	    })

	    socket.on('disconnect', function(data) {
	    	delete objUtilisateur[socket.id];
	    	io.sockets.emit('diffuser_list_user', objUtilisateur);
	    })
    })
 return io
}