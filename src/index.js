import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

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
        await db.collection("participantes").insertOne({ name, lastStatus: Date.now() });
        await db.collection("mensagens").insertOne({ from: name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format("HH:mm:ss") });
        res.sendStatus(201);
    }
});

server.get("/participants", async(req, res) => {
    const allParticipants = await db.collection("participantes").find({}).toArray();
    res.send(allParticipants);
})

server.post("/messages", async(req, res) => {
    const { to, text, type } = req.body;
    const { user } = req.headers.User;
})

// Remove usuários inativos
setInterval(async() => {
    const now = Date.now() - 10000;
    const users = await db.collection("participantes").find({ lastStatus: { $lt: now} }).toArray();
    users.forEach(async(element) => {
        await db.collection("mensagens").insertOne({ from: element.name, to: "Todos", text: "sai da sala...", type: "status", time: dayjs().format("HH:mm:ss") });
    });
    await db.collection("participantes").deleteMany({ lastStatus: { $lt: now} });
},15000)

server.listen(5000, () => {console.log("Servidor rodando!")});