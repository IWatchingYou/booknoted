import { ApolloServer, PubSub } from 'apollo-server-express';
const setting = require('./knexfile');
const knex = require('knex')(setting.development);
import 'graphql-import-node';
import { resolvers } from './graphql/resolvers';
import { userDataLoader } from './loaders/dataloader';
import express from 'express';
import http from 'http';

const typeDefs = require('./graphql/schema/schema.graphql');

const pubsub = new PubSub();

const server = new ApolloServer(
    {   
        typeDefs,
        resolvers,
        engine: {
            apiKey: "service:IWatchingYou-2272:eGNw8fjiZkQJcuekYpnzTg",
            schemaTag: 'development',
            debugPrintReports: false
        },
        subscriptions: {
            onConnect: () => console.log('Connected to websocket'),
            onDisconnect: () => console.log('Disconnected to websocket')
        },
        context: ({req}: any) => {

            const meLoader = async () => {
                const data = await knex('user').where('token', req.query.token).first();
                return userDataLoader.load(data.id);
            }

            return { userDataLoader, meLoader, pubsub }
        }
    }
);

const app = express();
app.use((req: any, res: any, next: any)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use('/images', express.static('images'));
server.applyMiddleware({ app, path: '/playground' });
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(4000);