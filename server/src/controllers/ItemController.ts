import connection from '../database/connection'
import { Request, Response } from 'express';

class ItemController {
    public async index(request:Request, response:Response) {
        const list =  await connection('itens').select('*');
        const serializeItens = list.map(item => {
            return {
                id: item.id,
                title: item.title,
                image_url: `http://localhost:3333/uploads/${item.image}`
            }
        })
        return response.json(serializeItens);
    }
}
export default ItemController;