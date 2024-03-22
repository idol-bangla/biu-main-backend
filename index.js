const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();
const port = 5000;
// Require the upload middleware
const upload = require("./middleware/multer");

//midleware
app.use(cors());
app.use(express.json()); // req.body undefined solve
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

cloudinary.config({
  cloud_name: process.env.Cloud_name,
  api_key: process.env.Api_key,
  api_secret: process.env.Api_secret,
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@bangla-idol-world-wide.ndfx9lx.mongodb.net/?retryWrites=true&w=majority&appName=Bangla-idol-world-wide`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("BIU");
    const adminSet = database.collection("Admin");
    const videoInfoCollection = database.collection("VideoInfo");
    const imgInfoCollection = database.collection("ImgInfo");
    const liveSiteCollection = database.collection("LiveSite");
    const eventInfoCollection = database.collection("EventInfo");
    const newsInfoCollection = database.collection("NewsInfo");

    //  video ......................................................................................
    app.post("/video-info", async (req, res) => {
      const videoInfo = req.body;
      const videoNeedInfo = {
        title: videoInfo.title,
        videoUrl: videoInfo.videoUrl,
      };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: videoInfo.email });

        if (admin) {
          const result = await videoInfoCollection.insertOne(videoNeedInfo);
          res.send(result);
        } else {
          // If the email doesn't exist, prevent posting to the database
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.get("/video-info", async (req, res) => {
      const query = {};
      const data = videoInfoCollection.find(query);
      const videoInfo = await data.toArray();
      res.send(videoInfo);
    });

    app.get("/video-info/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const videoInfo = await videoInfoCollection.findOne(query);
      res.send(videoInfo);
    });

    app.delete("/video-info/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email; // Assuming you send the user's email from frontend
      // console.log(userEmail);
      const query = { _id: new ObjectId(id) };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: userEmail });

        if (admin) {
          const result = await videoInfoCollection.deleteOne(query);
          res.send(result);
        } else {
          // If the email doesn't exist, prevent delete operation
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.put("/video-info/:id", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const paramsId = req.params.id;
      // console.log(paramsId);

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: data.email });

        if (admin) {
          const filter = { _id: new ObjectId(paramsId) };

          const options = { upsert: true };
          const updateDoc = {
            $set: {
              title: data.title,
              videoUrl: data.videoUrl,
            },
          };
          const result = await videoInfoCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(result);
        } else {
          // If the email doesn't exist, prevent posting to the database
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    // start imgInfoPost for Img galary ......................................................................................
    // POST route to create a new album
    app.post("/img-info", upload.single("img"), (req, res) => {
      try {
        const email = req.body.email;

        // Check if the user is an admin
        adminSet
          .findOne({ email: email })
          .then((admin) => {
            if (admin) {
              // If the user is an admin, proceed with file upload and other operations

              // Upload the file to Cloudinary
              cloudinary.uploader
                .upload(req.file.path)
                .then((result) => {
                  const title = req.body.title;
                  const albumName = req.body.albumName;

                  const postadd = {
                    title,
                    albumName,
                    imgSrc0: result.secure_url,
                    addImgCount: 1,
                  };

                  // Insert image information into the database
                  imgInfoCollection
                    .insertOne(postadd)
                    .then((result) => {
                      res.send(result);
                    })
                    .catch((error) => {
                      console.error("Error saving event information:", error);
                      res.status(500).send("Server Error");
                    });
                })
                .catch((err) => {
                  console.log(err);
                  return res.status(500).json({
                    success: false,
                    message: "Error uploading file to Cloudinary",
                  });
                });
            } else {
              // If the user is not an admin, deny access
              res
                .status(403)
                .send("Access denied. Your email is not authorized.");
            }
          })
          .catch((error) => {
            console.error("Error finding admin:", error);
            res.status(500).send("Server Error");
          });
      } catch (error) {
        console.error("Error handling event info:", error);
        res.status(500).send("Server Error");
      }
    });

    app.get("/img-info", async (req, res) => {
      const query = {};
      const imgInfo = imgInfoCollection.find(query);
      const imgInfo_s = await imgInfo.toArray();
      res.send(imgInfo_s);
    });

    app.get("/img-info/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const imgInfo = await imgInfoCollection.findOne(query);
      res.send(imgInfo);
    });

    app.delete("/img-info/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email; // Assuming you send the user's email from frontend
      // console.log(userEmail);
      const query = { _id: new ObjectId(id) };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: userEmail });

        if (admin) {
          const result = await imgInfoCollection.deleteOne(query);
          res.send(result);
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.put("/img-info/:id", upload.single("img"), async (req, res) => {
      console.log(req.body);
      try {
        const admin = await adminSet.findOne({ email: req.body.email });
        console.log(admin);
        const paramsId = req.params.id;
        const filter = { _id: new ObjectId(paramsId) };

        if (admin) {
          const documentId = req.params.id;
          const propertyName = req.body.propertyName;

          if (req.body.removeProperty) {
            // If removeProperty is present in the request body, remove the specified property

            console.log("1245");

            await imgInfoCollection.updateOne(
              { _id: new ObjectId(documentId) },
              { $unset: { [propertyName]: "" } }
            );
            res.json({ success: true });
          } else {
            const oldAlbum = await imgInfoCollection.findOne(filter);
            let old_addImgCount = oldAlbum.addImgCount;
            console.log(old_addImgCount);

            // Upload the file to Cloudinary
            const cloudinaryResult = await cloudinary.uploader.upload(
              req.file.path
            );

            const updateDoc = { $set: {} };

            // Construct the dynamic property
            const dynamicPropertyName = `imgSrc${old_addImgCount + 1}`;
            let addImgCount = "addImgCount";

            console.log(dynamicPropertyName);
            updateDoc.$set[dynamicPropertyName] = cloudinaryResult.secure_url;
            updateDoc.$set[addImgCount] = old_addImgCount + 1;

            const options = { upsert: true };

            // Update the document in the collection
            const updateResult = await imgInfoCollection.updateOne(
              filter,
              updateDoc,
              options
            );
            res.send(updateResult);
          }
        } else {
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (error) {
        console.error("Error handling image deletion:", error);
        res.status(500).send("Server Error");
      }
    });

    // Live Site Start ......................................................................................
    app.post("/live", async (req, res) => {
      const videoInfo = req.body;
      const videoNeedInfo = {
        title: videoInfo.title,
        videoUrl: videoInfo.videoUrl,
      };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: videoInfo.email });

        if (admin) {
          const result = await liveSiteCollection.insertOne(videoNeedInfo);
          res.send(result);
        } else {
          // If the email doesn't exist, prevent posting to the database
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.get("/live", async (req, res) => {
      const query = {};
      const data = liveSiteCollection.find(query);
      const videoInfo = await data.toArray();
      res.send(videoInfo);
    });

    app.get("/live/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const videoInfo = await liveSiteCollection.findOne(query);
      res.send(videoInfo);
    });

    app.delete("/live/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email; // Assuming you send the user's email from frontend
      // console.log(userEmail);
      const query = { _id: new ObjectId(id) };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: userEmail });

        if (admin) {
          const result = await liveSiteCollection.deleteOne(query);
          res.send(result);
        } else {
          // If the email doesn't exist, prevent delete operation
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.put("/live/:id", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const paramsId = req.params.id;
      // console.log(paramsId);

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: data.email });

        if (admin) {
          const filter = { _id: new ObjectId(paramsId) };

          const options = { upsert: true };
          const updateDoc = {
            $set: {
              title: data.title,
              videoUrl: data.videoUrl,
            },
          };
          const result = await liveSiteCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(result);
        } else {
          // If the email doesn't exist, prevent posting to the database
          res.status(403).send("Access denied. Your email is not authorized.");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    // Event Info start......................................................................................
    app.post("/event-info", upload.single("img"), (req, res) => {
      try {
        // Upload the file to Cloudinary
        cloudinary.uploader
          .upload(req.file.path)
          .then((result) => {
            const email = req.body.email;
            adminSet
              .findOne({ email: email })
              .then((admin) => {
                if (admin) {
                  const title = req.body.title;
                  const description = req.body.description;
                  const date = req.body.date;

                  const postadd = {
                    title,
                    description,
                    date,
                    imgSrc: result.secure_url,
                    finish: false,
                    recently_finish: false,
                  };

                  eventInfoCollection
                    .insertOne(postadd)
                    .then((result) => {
                      res.send(result);
                    })
                    .catch((error) => {
                      console.error("Error saving event information:", error);
                      res.status(500).send("Server Error");
                    });
                } else {
                  res
                    .status(403)
                    .send("Access denied. Your email is not authorized.");
                }
              })
              .catch((error) => {
                console.error("Error finding admin:", error);
                res.status(500).send("Server Error");
              });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({
              success: false,
              message: "Error uploading file to Cloudinary",
            });
          });
      } catch (error) {
        console.error("Error handling event info:", error);
        res.status(500).send("Server Error");
      }
    });

    app.get("/event-info", async (req, res) => {
      const query = {};
      const eventInfo = eventInfoCollection.find(query);
      const event_Info_s = await eventInfo.toArray();
      res.send(event_Info_s);
    });

    app.get("/event-info/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const imgInfo = await eventInfoCollection.findOne(query);
      res.send(imgInfo);
    });

    app.delete("/event-info/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email; // Assuming you send the user's email from frontend
      // console.log(userEmail);
      const query = { _id: new ObjectId(id) };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: userEmail });

        if (admin) {
          const result = await eventInfoCollection.deleteOne(query);
          res.send(result);
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.put("/event-info/:id", upload.single("img"), async (req, res) => {
      console.log(req.body);
      try {
        const email = req.body.email;
        const admin = await adminSet.findOne({ email: email });

        if (admin) {
          const paramsId = req.params.id;
          const filter = { _id: new ObjectId(paramsId) };
          const options = { upsert: true };

          let { title, description, date, finish, recently_finish } = req.body;

          if (finish === "true") {
            finish = true;
          }
          if (finish === "false") {
            finish = false;
          }
          if (recently_finish === "true") {
            recently_finish = true;
          }
          if (recently_finish === "false") {
            recently_finish = false;
          }

          let imgSrc; // Variable to store the image source URL

          if (req.file) {
            // File uploaded, upload it to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
            imgSrc = result.secure_url;
          } else {
            // No file uploaded, retain the existing imgSrc value from the database
            const existingEvent = await eventInfoCollection.findOne(filter);
            imgSrc = existingEvent.imgSrc;
          }

          const updateDoc = {
            $set: {
              title,
              description,
              date,
              imgSrc, // Use the updated imgSrc value
              finish: finish,
              recently_finish: recently_finish,
            },
          };

          console.log(updateDoc);
          const updateResult = await eventInfoCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(updateResult);
        } else {
          res.status(404).send("Admin not found");
        }
      } catch (error) {
        console.error("Error updating image information:", error);
        res.status(500).send("Server Error");
      }
    });

    // news info ......................................................................................
    // Event Info start......................................................................................
    app.post("/news-info", upload.single("img"), (req, res) => {
      try {
        // Upload the file to Cloudinary
        cloudinary.uploader
          .upload(req.file.path)
          .then((result) => {
            const email = req.body.email;
            adminSet
              .findOne({ email: email })
              .then((admin) => {
                if (admin) {
                  const title = req.body.title;
                  const description = req.body.description;
                  const date = req.body.date;

                  const postadd = {
                    title,
                    description,
                    date,
                    imgSrc: result.secure_url,
                    recent: false,
                  };

                  newsInfoCollection
                    .insertOne(postadd)
                    .then((result) => {
                      res.send(result);
                    })
                    .catch((error) => {
                      console.error("Error saving event information:", error);
                      res.status(500).send("Server Error");
                    });
                } else {
                  res
                    .status(403)
                    .send("Access denied. Your email is not authorized.");
                }
              })
              .catch((error) => {
                console.error("Error finding admin:", error);
                res.status(500).send("Server Error");
              });
          })
          .catch((err) => {
            console.log(err);
            return res.status(500).json({
              success: false,
              message: "Error uploading file to Cloudinary",
            });
          });
      } catch (error) {
        console.error("Error handling event info:", error);
        res.status(500).send("Server Error");
      }
    });

    app.get("/news-info", async (req, res) => {
      const query = {};
      const eventInfo = newsInfoCollection.find(query);
      const event_Info_s = await eventInfo.toArray();
      res.send(event_Info_s);
    });

    app.get("/news-info/:id", async (req, res) => {
      // console.log(req.params.id);
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const imgInfo = await newsInfoCollection.findOne(query);
      res.send(imgInfo);
    });

    app.delete("/news-info/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email; // Assuming you send the user's email from frontend
      // console.log(userEmail);
      const query = { _id: new ObjectId(id) };

      try {
        // Check if the provided email exists in the database
        const admin = await adminSet.findOne({ email: userEmail });

        if (admin) {
          const result = await newsInfoCollection.deleteOne(query);
          res.send(result);
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    });

    app.put("/news-info/:id", upload.single("img"), async (req, res) => {
      console.log(req.body);
      try {
        const email = req.body.email;
        const admin = await adminSet.findOne({ email: email });

        if (admin) {
          const paramsId = req.params.id;
          const filter = { _id: new ObjectId(paramsId) };
          const options = { upsert: true };

          let { title, description, date, recent } = req.body;

          if (recent === "true") {
            recent = true;
          }
          if (recent === "false") {
            recent = false;
          }

          let imgSrc; // Variable to store the image source URL

          if (req.file) {
            // File uploaded, upload it to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
            imgSrc = result.secure_url;
          } else {
            // No file uploaded, retain the existing imgSrc value from the database
            const existingEvent = await newsInfoCollection.findOne(filter);
            imgSrc = existingEvent.imgSrc;
          }

          const updateDoc = {
            $set: {
              title,
              description,
              date,
              imgSrc, // Use the updated imgSrc value
              recent: recent,
            },
          };

          console.log(updateDoc);
          const updateResult = await newsInfoCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(updateResult);
        } else {
          res.status(404).send("Admin not found");
        }
      } catch (error) {
        console.error("Error updating image information:", error);
        res.status(500).send("Server Error");
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Wellcome To BIU!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
