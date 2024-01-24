import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })

// const size = multer({
//   limits: {
//     fileSize: 104857600
//   },
//   });
  
  export const upload = multer({ storage: storage})
