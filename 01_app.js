const express = require('express');
const fs = require('fs')
const util = require("util");
const app = express();

var server = require('http').createServer(app);
var io = require('./mes_modules/chat_socket').listen(server);

const peupler = require('./mes_modules/peupler')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient // le pilote MongoDB
const ObjectID = require('mongodb').ObjectID;
app.use(bodyParser.urlencoded({extended: true}))

app.use(express.static('public'));
const i18n = require('i18n');
const cookieParser = require('cookie-parser');

/* Ajoute l'objet i18n à l'objet global «res» */
app.use(cookieParser());
app.use(i18n.init);

i18n.configure({ 
   locales : ['fr', 'en'],
   cookie : 'langueChoisie', 
   directory : __dirname + '/locales' })

let db 

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {
 if (err) return console.log(err)
 db = database.db('carnet_adresse')

// lancement du serveur Express sur le port 8081
server.listen(8081, () => {
 console.log('connexion à la BD et on écoute sur le port 8081')
 })
})


/*
Les routes
*/

////////////////////////////////////////// Route /
app.set('view engine', 'ejs'); // générateur de template

app.get('/:locale(en|fr)',  (req, res) => {
  // on récupère le paramètre de l'url pour enregistrer la langue

  res.setLocale(req.params.locale)
  res.cookie('langueChoisie', req.params.locale)

  // on peut maintenant traduire
  //console.log('Cookies: ', req.cookies.langueChoisie);

  res.redirect(req.get("referer"))
  //res.render('accueil.ejs') 
})


////////////////////////////////////////////
app.get('/', function (req, res) {

	res.render('accueil.ejs')  
 
});

//////////////////////////////////////////  Route Adresse
app.get('/adresse', function (req, res) {
   var cursor = db.collection('adresse')
                .find().toArray(function(err, resultat){
 if (err) return console.log(err)        
 res.render('adresse.ejs', {adresses: resultat})   
  });
})
//////////////////////////////////////////  Route Rechercher
app.post('/rechercher',  (req, res) => {
   let recherche = req.body.recherche.toLowerCase()
   let regRecherche = new RegExp(recherche, 'i')
   var match = regRecherche.exec(recherche);
	console.log("match[0] = " + match[0]); 
	console.log("match[1] = " + match[1]); 

   console.log(recherche)
   let cursor = db.collection('adresse')
                .find({$or: [ 
                				{nom: {$regex :regRecherche, $options: "$i"}},
                			  {prenom: {$regex :regRecherche, $options: "$i"}},
                			 	{telephone: {$regex :regRecherche, $options: "$i"}},
                				{courriel: {$regex :regRecherche, $options: "$i"}}
                			]
                		}).toArray(function(err, resultat){
 if (err) return console.log(err)        
 res.render('adresse.ejs', {adresses: resultat, recherche:recherche})   
  });
})
////////////////////////////////////////// Route /ajouter
app.post('/ajouter', (req, res) => {
console.log('route /ajouter')	
 db.collection('adresse').save(req.body, (err, result) => {
 if (err) return console.log(err)
 // console.log(req.body)	
 console.log('sauvegarder dans la BD')
 res.redirect('/adresse')
 })
})

////////////////////////////////////////  Route /modifier
app.post('/modifier', (req, res) => {
console.log('route /modifier')
// console.log('util = ' + util.inspect(req.body));
req.body._id = 	ObjectID(req.body._id)
 db.collection('adresse').save(req.body, (err, result) => {
	 if (err) return console.log(err)
	 console.log('sauvegarder dans la BD')
	 res.redirect('/adresse')
	 })
})


////////////////////////////////////////  Route /detruire
app.get('/detruire/:id', (req, res) => {
 console.log('route /detruire')
 // console.log('util = ' + util.inspect(req.params));	
 var id = req.params.id
 console.log(id)
 db.collection('adresse')
 .findOneAndDelete({"_id": ObjectID(req.params.id)}, (err, resultat) => {

if (err) return console.log(err)
 res.redirect('/adresse')  // redirige vers la route qui affiche la collection
 })
})


///////////////////////////////////////////////////////////   Route /trier
app.get('/trier/:cle/:ordre', (req, res) => {

 let cle = req.params.cle
 let ordre = (req.params.ordre == 'asc' ? 1 : -1)
 let cursor = db.collection('adresse').find().sort(cle,ordre).toArray(function(err, resultat){

  ordre = (req.params.ordre == 'asc' ? 'desc' : 'asc')  
 res.render('adresse.ejs', {adresses: resultat, cle, ordre })	
})

}) 
/////////////////////////////////////////////////////////  Route /peupler
app.get('/peupler', (req, res) => {
	let collectionMembre = peupler()

	let cursor = db.collection('adresse').insertMany(collectionMembre, (err, resultat)=>{
		if(err) console.error(err)
			res.redirect('/adresse')
		})
})

/////////////////////////////////////////////////////////  Route /peupler
app.get('/vider', (req, res) => {

	let cursor = db.collection('adresse').drop((err, res)=>{
		if(err) console.error(err)
			console.log('ok')
			
		})
	res.redirect('/adresse')
})

app.get('/chat', (req, res) => {
	res.render('socket_vue.ejs')
})


