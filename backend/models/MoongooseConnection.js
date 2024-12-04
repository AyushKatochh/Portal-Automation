const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://harsh8423:8423047004@cluster0.1xbklyu.mongodb.net/aicte').then(()=>{
    console.log("connection open !!")
})
.catch((err) => {
    console.log("error in catch")
    console.log(err);
})
console.log('started')