// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// This is try catch method

// const asyncHandler = (fn)=> async()=>{
//     try{
//         await fn(req, res, next)
//     }
//     catch(error){
//         res.status(err.code || 500).json({
//             success : false,
//             message:err.message
//         })
//     }
// }

// This is promises method

 /*This code is commonly used in Express.js middleware to handle 
asynchronous operations within route handlers. It helps in avoiding 
explicit error handling in every asynchronous route handler by allowing 
the use of async/await syntax while still catching and forwarding errors
to the Express error handling middleware.*/


const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export {asyncHandler}