import express from 'express';
import ItemController from './controllers/ItemController'
import PointController from './controllers/PointController';

const routes = express.Router();

routes.get('/', (request, response)=>{
    response.json({ messege: "Hello Worls!"})
})

const itemController = new ItemController();
routes.get('/itens', itemController.index)

const pointController = new PointController();
routes.get('/points', pointController.index)
routes.get('/points/:id', pointController.show)
routes.post('/point', pointController.create)


export default routes;