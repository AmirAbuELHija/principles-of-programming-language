import {map } from "ramda";
import {  Exp, Program, isExp, isProgram, makeProgram, isCExp, isDefineExp, makeDefineExp, isAtomicExp,
    makeIfExp, isIfExp, CExp, parseL31CExp, CondExp, unparseL31, parseL31,  isCondExp, IfExp, isProcExp, makeProcExp, makeCondExp, makeAppExp, isAppExp, isLitExp, makeElseClause, isElseClause, ElseClause, makeStrExp, isLetExp, makeLetExp } from "./L31-ast";
import { Result, makeFailure, makeOk, isOk } from "../shared/result";
import parse from "s-expression";


/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
    makeOk(rewriteAllCond(exp));

const rewriteCond = (e: CondExp): IfExp =>
    (e.condclauses.length > 1) ? makeIfExp(e.condclauses[0].test, e.condclauses[0].then[0],makeCondExp(e.condclauses.slice(1), makeElseClause(e.elseClause.then) ))
    : makeIfExp(e.condclauses[0].test, e.condclauses[0].then[0], e.elseClause);

const rewriteAllCond = (exp: Program | Exp): Program | Exp =>
    isExp(exp) ? rewriteAllCondExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllCondExp, exp.exps)) :
    exp;

const rewriteAllCondExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllCondCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllCondCExp(exp.val)) :
    exp;

const rewriteAllCondCExp = (exp: CExp): CExp => 
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllCondCExp(exp.test),
                             rewriteAllCondCExp(exp.then),
                             rewriteAllCondCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllCondCExp(exp.rator),
                               map(rewriteAllCondCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllCondCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(exp.bindings, exp.body) :
    isElseClause(exp) ?  rewriteElseClause(exp):
    isCondExp(exp) ? rewriteAllCondCExp(rewriteCond(exp)) :
    exp;

const rewriteElseClause = (exp: ElseClause) : CExp =>{
    const str = unparseL31(exp.then).slice(1,-2);
    const parsed_str = parse(str);
    const parsed_str_Sexp = parseL31CExp(parsed_str);
    if(isOk(parsed_str_Sexp)){
        const cexp = parsed_str_Sexp.value
        return cexp;
    }
    return exp.then

}
        
