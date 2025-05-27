import { Router } from "express";
import { deleteSessionHanler, getSessionHandler } from "../controllers/session.controller";

const sessionRoutes =  Router();

sessionRoutes.get("/" ,  getSessionHandler);
sessionRoutes.delete("/:id" , deleteSessionHanler);

export default sessionRoutes;