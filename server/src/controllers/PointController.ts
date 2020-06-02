import { Request, Response, response } from "express";
import connection from "../database/connection";

class PointController {
    private static async listItens(idPoint: number) {
        const itens =  await connection.table('points_itens')
        .join('itens', 'points_itens.item_id', 'itens.id')
        .where('point_id', idPoint).select({
            id: 'itens.id',
            title: 'itens.title',
            image: 'itens.image',
        });
        
        const serializeItens = itens.map(item => {
            return {
                id: item.id,
                title: item.title,
                image_url: `http://localhost:3333/uploads/${item.image}`
            }
        })

        return serializeItens;
    }

    public async index(request:Request, response:Response){

        var parsedItens:number[] = new Array();
        const {city, uf, itens} = request.query;

        if(itens) {
            parsedItens = String(itens)
            .split(',')
            .map(item => Number(item.trim()));
        }
        
        const sql = connection.table('points')
        .select('points.*');

        if(parsedItens.length) {
            sql.join('points_itens', 'points_itens.point_id', 'points.id')
            sql.whereIn('points_itens.item_id', parsedItens)
            sql.distinct()
        }

        if(city) {
            sql.where('points.city', String(city))
        }

        if(uf) {
            sql.where('points.uf', String(uf))
        }

        const list = await sql;

        const serializePoint = list.map(async point => {
            var itensLoad = await PointController.listItens(point.id);
            return {
                id: point.id,
                image: point.image,
                name: point.name,
                email: point.email,
                whatsapp: point.whatsapp,
                latitude: point.latitude,
                longitude: point.longitude,
                city: point.city,
                itens: itensLoad.length > 0 ? itensLoad : null
            }
        });

        return response.json(await Promise.all(serializePoint));
    }

    public async show(request:Request, response:Response) {
        const {id} = request.params;
        const list =  await connection('points')
        .where('id', id)
        .select('*')
        .first();
        if(!list) {
            return response.status(404).json({err: "Point not found!"});
        }
        const itemLoad = await PointController.listItens(list.id);
        list.itens = itemLoad.length ? itemLoad : null;
        return response.status(200).json(list);
    }

    public async create(request:Request, response:Response){
        const {image, name, email, whatsapp, latitude, longitude, city, uf, itens} = request.body;
            try {
                const trx = await connection.transaction();
                const [id] = await trx('points').insert({
                    image: "https://images.unsplash.com/photo-1498579397066-22750a3cb424?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60",
                    name,
                    email,
                    whatsapp,
                    latitude,
                    longitude,
                    city,
                    uf
                });

                const serializeItens = itens.map((item: number) => {
                    return {
                        point_id: id,
                        item_id: item
                    }
                });

                await trx('points_itens').insert(serializeItens);
                await trx.commit();

                const list =  await connection('points')
                .where('id', id)
                .select('*')
                .first();
                list.itens = await PointController.listItens(list.id);

                return response.status(200).json(list);

            } catch (err){
                console.log(err);
                return response.status(500).send({err: "Error create colect point. try again later!"})
            }
    }
}

export default PointController;
