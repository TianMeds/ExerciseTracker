const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let bodyParser = require('body-parser');
let mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const { ObjectId } = require('mongodb');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Schema = mongoose.Schema;


const userSchema = new Schema({
  // data username
  username: {
    type: String,
    required: true,
  },
});

const exerciseSchema = new Schema({
  // data user
  user: {
    type: ObjectId,
    required: true,
  },
  // data description
  description: {
    type: String,
    required: true,
  },
  // data duration
  duration: {
    type: Number,
    required: true,
  },
  // data date
  date: {
    type: String,
    required: true,
  },
  // data unix
  unix: {
    type: Number,
    required: true,
  },

});


let User = mongoose.model('users', userSchema);
let Exercise = mongoose.model('exersices', exerciseSchema);


app.get('/api/users', async function(req, res) {

  let users = await User.find().exec();

  res.send(users);
})

app.post('/api/users', function(req, res) {

  let username = req.body.username;


  let newUser = new User({
    'username': username,
  })


  newUser.save()


  res.json({
    username: newUser.username,
    _id: newUser._id
  })
})


app.post('/api/users/:_id/exercises', async function(req, res) {

  let id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  let unix, newExercise;


  if (!date) {
    date = new Date().toDateString()
    unix = new Date().getTime();
  } else {
    unix = new Date().getTime();
    date = new Date(date).toDateString()
  }

  // Menambil data user
  let user = await User.findById(id);


  if (!user) {
    return res.json({
      error: "Invalid User"
    });
  }

  try {

    let newExerciseObj = new Exercise({
      user: new ObjectId(id),
      date: date,
      unix: unix,
      duration: duration,
      description: description,
    });


    newExercise = await newExerciseObj.save();
  } catch (e) {
    console.error(e);
  }


  return res.send({
    _id: user._id,
    username: user.username,
    date: newExercise.date,
    duration: newExercise.duration,
    description: newExercise.description
  });
})


app.get('/api/users/:_id/logs', async function(req, res) {

  let id = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = Number(req.query.limit);
  let from_miliseconds, to_miliseconds, count, exercises;


  let user = await User.findById({ _id: id }).exec();

  if (!user) {
    res.json({
      error: 'User is not registered'
    })
  }


  if (from && to) {
    from_miliseconds = new Date(from).getTime() - 1; 
    to_miliseconds = new Date(to).getTime() - 1; 


    count = await Exercise.find({ user: id, unix: { $gt: from_miliseconds, $lt: to_miliseconds } }).countDocuments();


    if (!limit) {
      limit = count;
    }


    exercises = await Exercise
      .find({ user: id, unix: { $gt: from_miliseconds, $lt: to_miliseconds } })
      .select({
        _id: 0,
        description: 1,
        duration: 1,
        date: 1,
      })
      .limit(limit)
      .exec();
  }


  else if (from) {
    from_miliseconds = new Date(from).getTime();


    count = await Exercise.find({ user: id, unix: { $gt: from_miliseconds } }).countDocuments();


    if (!limit) {
      limit = count;
    }


    exercises = await Exercise
      .find({ user: id, unix: { $gt: from_miliseconds } })
      .select({
        _id: 0,
        description: 1,
        duration: 1,
        date: 1,
      })
      .limit(limit)
      .exec();
  }


  else if (to) {
    to_miliseconds = new Date(to).getTime();

    count = await Exercise.find({ user: id, unix: { $lt: to_miliseconds } }).countDocuments();


    if (!limit) {
      limit = count;
    }

    exercises = await Exercise
      .find({ user: id, unix: { $lt: to_miliseconds } })
      .select({
        _id: 0,
        description: 1,
        duration: 1,
        date: 1,
      })
      .limit(limit)
      .exec();
  }


  count = await Exercise.find({ user: id }).countDocuments();


  if (!limit) {
    limit = count;
  }


  exercises = await Exercise
    .find({ user: id })
    .select({
      _id: 0,
      description: 1,
      duration: 1,
      date: 1,
    })
    .limit(limit)
    .exec();

  return res.send({
    username: user.username,
    count: count,
    _id: user._id,
    log: exercises
  })

})


MONGO_URI = `mongodb+srv://tianmeds:ABCDEFG123@cluster0.l8rxcri.mongodb.net/?retryWrites=true&w=majority`;
;

const start = async () => {
  try {
    let port = 3001;
    await mongoose.connect(MONGO_URI);

    app.listen(port, function() {
      console.log(`Listening on port ${port}`);
    });
  } catch (e) {
    console.log(e.message)
  }
}

start();