import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();


const cliente = new MongoClient("mongodb://127.0.0.1:27017");
let db;

cliente.connect().then(() => {
    db = cliente.db("uol");
});

const server = express();

server.use(express.json());
server.use(cors());

server.post("/participants", async (req, res) => {
    const { name } = req.body;
    const nameExists = await db.collection("participantes").findOne({ name: name });
    console.log(nameExists);
    //validacoes
    if (name === "") {
        res.sendStatus(422);
        return;
    } else if (nameExists !== null) {
        res.sendStatus(409);
        return;
    } else {
        db.collection("participantes").insertOne({ name, lastStatus: Date.now() });
        res.sendStatus(201);
    }
});

server.get("/participants", async(req, res) => {
    const allParticipants = await db.collection("participantes").find({}).toArray();
    res.send(allParticipants);
})

server.listen(5000, () => {console.log("Servidor rodando!")});