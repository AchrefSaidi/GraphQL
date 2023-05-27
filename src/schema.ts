import { createSchema } from "graphql-yoga";

import {db} from "./data/db"
import {makeExecutableSchema} from "@graphql-tools/schema";
const fs = require("fs");
const path = require("path");
export const schema =  makeExecutableSchema({
    typeDefs:fs.readFileSync(
        path.join(__dirname, "/schema/schema.graphql"),
        "utf-8"
    ),
    resolvers: {
        Query: {
            hello: (parent,args,{db}) => `Hello World }!`,
            users: (parent,args,{db})=> db.user,
            cvs: (parent,args,{db})=> db.cv,
            skills:(parent,args,{db})=> db.skill,
            cvById:(parent,{id},{db})=> db.cv.find((cv:any)=>cv.id===id)
        },
        Mutation:{
            addCv:(parent,{input},{db,pubSub})=> {
                const cv={...input}
                cv.id=db.cv[db.cv.length-1].id+1
                db.cv.push(cv)
                pubSub.publish("cvAdded",cv)
                return db.cv
            },
            updateCv:(parent, {input},{db,pubSub})=> {
                const index = db.cv.indexOf( db.cv.find((cv:any)=>cv.id===input.id))
                db.cv[index]={...input}
                pubSub.publish("cvUpdated",db.cv[index])
                return db.cv[index]
            },
            deleteCv:(parent, {id},{db,pubSub})=> {
                const index = db.cv.indexOf( db.cv.find((cv:any)=>cv.id===id))
                db.cv.splice(index, 1);
                pubSub.publish("cvDeleted",db.cv)
                return db.cv
            },
        },
        Subscription:{
            cvAdded:{
                subscribe: (parent, args, { db, pubSub }) => pubSub.subscribe("cvAdded"),
                resolve: (payload) => { return payload;}},
            cvUpdated:{
                subscribe: (parent, args, { db, pubSub }) => pubSub.subscribe("cvUpdated"),
                resolve: (payload) => { return payload;}},
            cvDeleted:{
                subscribe: (parent, args, { db, pubSub }) => pubSub.subscribe("cvDeleted"),
                resolve: (payload) => { return payload;}}
        },
        user:{
            cvs : (user,args,{db})=> db.cv.filter((cv:any) => cv.idUser === user.id)
        },
        cv:{
            skills: (cv,args,{db})=> {
                const skills=[]
                for (const element of db.cv_skill) {
                    if(cv.id===element.idCv){
                        skills.push(db.skill.find((skill: any)=>skill.id===element.idSkill))
                    }
                }
                return skills
            },
            user:(cvs,args,{db})=> {
                const c = db.cv.find((cv: any) => cv.id === cvs.id)
                return db.user.find((user: any) => user.id === c.idUser)
            }
        },
        skill:{
            cvs: (skill,args,{db})=> {
                const cvs=[]
                for (const element of db.cv_skill) {
                    if(skill.id===element.idSkill){
                        cvs.push(db.cv.find((cv: any)=>cv.id===element.idCv))
                    }
                }
                return cvs
            }
        }
    },
});