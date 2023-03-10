const express = require('express');
const router = express.Router();

const dotenv = require("dotenv");

dotenv.config();

const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_APIKEY}`);

function predictImage(inputs) {
    return new Promise((resolve, reject) => {
        stub.PostModelOutputs(
            {
                model_id: "aaa03c23b3724a16a56b629203edc62c",
                inputs: inputs
            },
            metadata,
            (err, response) => {
                if (err) {
                    reject("Error: " + err);
                    return;
                }

                if (response.status.code !== 10000) {
                    reject("Received failed status: " + response.status.description + "\n" + response.status.details);
                    return;
                }

                let results = [];
                for (const c of response.outputs[0].data.concepts) {
                    results.push({
                        name: c.name,
                        value: c.value
                    })
                }
                resolve(results);
            }
        );
    })
}

router.post('/', async function (req, res, next) {
    try {
        const { imageUrl } = req.body;
        const inputs = [
            {
                data: {
                    image: {
                        url: imageUrl
                    }
                }
            }
        ];
        const results = await predictImage(inputs);
        return res.send({
            results
        })
    } catch (err) {
        return res.status(400).send({
            error: err
        })
    }
});

module.exports = router;