import { isTypedArray } from 'util/types';
import { Exp, isProgram, makeNumExp, parseL5, Program } from '../src/L5/L5-ast';
import { typeofProgram, L5typeof, checkCompatibleType, typeofIf, typeofExp, makeUnion } from '../src/L5/L5-typecheck';
import { applyTEnv } from '../src/L5/TEnv';
import { isNumTExp, isProcTExp, makeBoolTExp, makeNumTExp, makeProcTExp, makeTVar, 
         makeVoidTExp, parseTE, unparseTExp, TExp, isTExp, makeUnionTExp, makeStrTExp } from '../src/L5/TExp';
import { makeOk, isOk, bind, mapv, isFailure, Result, makeFailure } from '../src/shared/result';

describe('L5 Type Checker', () => {
    describe('parseTE', () => {
        it('parses atoms', () => {
            expect(parseTE("number")).toEqual(makeOk(makeNumTExp()));
            expect(parseTE("boolean")).toEqual(makeOk(makeBoolTExp()));
        });

        it('parses type variables', () => {
            expect(parseTE("T1")).toEqual(makeOk(makeTVar("T1")));
        });

        it('parses procedures', () => {
            expect(parseTE("(number -> (number -> number))")).toEqual(
                makeOk(makeProcTExp([makeNumTExp()], makeProcTExp([makeNumTExp()], makeNumTExp())))
            );
        });

        it('parses "void" and "Empty"', () => {
            expect(parseTE("void")).toEqual(makeOk(makeVoidTExp()));
            expect(parseTE("(Empty -> void)")).toEqual(makeOk(makeProcTExp([], makeVoidTExp())));
        });
    });

    describe('unparseTExp', () => {
        it('unparses atoms', () => {
            expect(unparseTExp(makeNumTExp())).toEqual(makeOk("number"));
            expect(unparseTExp(makeBoolTExp())).toEqual(makeOk("boolean"));
        });

        it('unparses type variables', () => {
            expect(unparseTExp(makeTVar("T1"))).toEqual(makeOk("T1"));
        });

        it('unparses procedures', () => {
            expect(unparseTExp(makeProcTExp([makeTVar("T"), makeTVar("T")], makeBoolTExp()))).toEqual(makeOk("(T * T -> boolean)"));
            expect(unparseTExp(makeProcTExp([makeNumTExp()], makeProcTExp([makeNumTExp()], makeNumTExp())))).toEqual(makeOk("(number -> (number -> number))"));
        });
    });

    describe('L5typeof', () => {
        it('returns the types of atoms', () => {
            expect(L5typeof("5")).toEqual(makeOk("number"));
            expect(L5typeof("#t")).toEqual(makeOk("boolean"));
        });

        it('returns the type of primitive procedures', () => {
            expect(L5typeof("+")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("-")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("*")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("/")).toEqual(makeOk("(number * number -> number)"));
            expect(L5typeof("=")).toEqual(makeOk("(number * number -> boolean)"));
            expect(L5typeof("<")).toEqual(makeOk("(number * number -> boolean)"));
            expect(L5typeof(">")).toEqual(makeOk("(number * number -> boolean)"));
            expect(L5typeof("not")).toEqual(makeOk("(boolean -> boolean)"));
        });

        it("returns the type of primitive op applications", () => {
            expect(L5typeof("(+ 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(- 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(* 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(/ 1 2)")).toEqual(makeOk("number"));

            expect(L5typeof("(= 1 2)")).toEqual(makeOk("boolean"));
            expect(L5typeof("(< 1 2)")).toEqual(makeOk("boolean"));
            expect(L5typeof("(> 1 2)")).toEqual(makeOk("boolean"));

            expect(L5typeof("(not (< 1 2))")).toEqual(makeOk("boolean"));
        });

        it('returns the type of "if" expressions', () => {
            expect(L5typeof("(if (> 1 2) 1 2)")).toEqual(makeOk("number"));
            expect(L5typeof("(if (= 1 2) #t #f)")).toEqual(makeOk("boolean"));
        });

        it('returns the type of procedures', () => {
            expect(L5typeof("(lambda ((x : number)) : number x)")).toEqual(makeOk("(number -> number)"));
            expect(L5typeof("(lambda ((x : number)) : boolean (> x 1))")).toEqual(makeOk("(number -> boolean)"));
            expect(L5typeof("(lambda((x : number)) : (number -> number) (lambda((y : number)) : number (* y x)))")).toEqual(makeOk("(number -> (number -> number))"));
            expect(L5typeof("(lambda((f : (number -> number))) : number (f 2))")).toEqual(makeOk("((number -> number) -> number)"));
            expect(L5typeof("(lambda((x : number)) : number (let (((y : number) x)) (+ x y)))")).toEqual(makeOk("(number -> number)"));
            expect(L5typeof("(lambda((f : ((union number boolean) -> number))) : number (f 2))")).toEqual(makeOk("(((union boolean number) -> number) -> number)"));

        });

        it('returns the type of "let" expressions', () => {
            expect(L5typeof("(let (((x : number) 1)) (* x 2))")).toEqual(makeOk("number"));
            expect(L5typeof("(let (((x : number) 1) ((y : number) 3)) (+ x y))")).toEqual(makeOk("number"));
            expect(L5typeof('(let (((x : number) 1) ((y : number) 2)) (lambda((a : number)) : (union string number) (if #t 2 "ok")))')).toEqual(makeOk("(number -> (union number string))"));
        });

        it('returns the type of "letrec" expressions', () => {
            expect(L5typeof("(letrec (((p1 : (number -> number)) (lambda((x : number)) : number (* x x)))) p1)")).toEqual(makeOk("(number -> number)"));
            expect(L5typeof("(letrec (((p1 : (number -> number)) (lambda((x : number)) : number (* x x)))) (p1 2))")).toEqual(makeOk("number"));
            expect(L5typeof(`
                (letrec (((odd? : (number -> boolean)) (lambda((n : number)) : boolean (if (= n 0) #f (even? (- n 1)))))
                         ((even? : (number -> boolean)) (lambda((n : number)) : boolean (if (= n 0) #t (odd? (- n 1))))))
                  (odd? 12))`)).toEqual(makeOk("boolean"));
        });

        it('returns "void" as the type of "define" expressions', () => {
            expect(L5typeof("(define (foo : number) 5)")).toEqual(makeOk("void"));
            expect(L5typeof("(define (foo : (number * number -> number)) (lambda((x : number) (y : number)) : number (+ x y)))")).toEqual(makeOk("void"));
            expect(L5typeof("(define (x : (Empty -> number)) (lambda () : number 1))")).toEqual(makeOk("void"));
        });
	});

    // TODO L51 Typecheck program with define
    describe('L5 Typecheck program with define', () => {

    });

    // TODO L51 Test checkCompatibleType with unions
    describe('L5 Test checkCompatibleType with unions', () => {
        // TODO L51
        const exp=makeNumExp(6)
        it('returns failure for incompatible unions', () => {
            const texp1: Result<TExp> = parseTE('(union number boolean)');
            const texp2: Result<TExp> = parseTE('string');
            if (isOk(texp1) && isOk(texp2)) {
              const result: Result<boolean> = checkCompatibleType(texp1.value, texp2.value,exp);
              expect(isFailure(result)).toEqual(true);
            } else {
              fail('Parsing failed');
            }
          });
          it('returns true for incompatible unions', () => {
            const texp1: Result<TExp> = parseTE('(union number boolean)');
            const texp2: Result<TExp> = parseTE('boolean');
            
            if (isOk(texp1) && isOk(texp2)) {
              const result: Result<boolean> = checkCompatibleType(texp1.value, texp2.value,exp);
              expect(isFailure(result)).toEqual(true);
            } else {
              fail('Parsing failed');
            }
          });
          it('returns failure for incompatible unions', () => {
            const texp2: Result<TExp> = parseTE('(union number (union string boolean))');
            const texp1: Result<TExp> = parseTE('string');
            
            if (isOk(texp1) && isOk(texp2)) {
              const result: Result<boolean> = checkCompatibleType(texp1.value, texp2.value,exp);
              expect(result).toEqual(makeOk(true));
            } else {
              fail('Parsing failed');
            }
          });
          it(' 2 union test', () => {
            
             expect(isFailure(checkCompatibleType(makeUnionTExp([makeNumTExp(),makeBoolTExp()]),makeUnionTExp([makeBoolTExp(),makeStrTExp()]),exp))).toEqual(true);
          });
          
    });


    describe('L5 Test makeUnion', () => {
        // makeUnion( number, boolean) -> union((number, boolean))
        it('makeUnion tests', () => {
            expect(makeUnion(makeNumTExp(),makeBoolTExp())).toEqual(makeUnionTExp([makeBoolTExp(),makeNumTExp()]));
        //  makeUnion( union(number, boolean), string) -> union(boolean, number, string)
            expect(makeUnion(makeUnionTExp([makeNumTExp(),makeBoolTExp()]),makeStrTExp())).toEqual(makeUnionTExp([makeBoolTExp(),makeNumTExp(),makeStrTExp()]));
        // makeUnion( union(number, boolean), union(boolean, string)) -> union(boolean, number, string)
            expect(makeUnion(makeUnionTExp([makeNumTExp(),makeBoolTExp()]),makeUnionTExp([makeBoolTExp(),makeStrTExp()]))).toEqual(makeUnionTExp([makeBoolTExp(),makeNumTExp(),makeStrTExp()]));
        // makeUnion( number, union(number, boolean)) -> union(boolean, number)
            expect(makeUnion(makeNumTExp(),makeUnionTExp([makeNumTExp(),makeBoolTExp()]))).toEqual(makeUnionTExp([makeBoolTExp(),makeNumTExp()]));
        });
    });
    
    // TODO L51 Test typeOfIf with union in all relevant positions
    describe('L5 Test typeOfIf with union in all relevant positions', () => {
        it('should return the correct type for if expressions with unions', () => {
            // (if #t 1 #t) -> union(boolean, number)
            expect(L5typeof("(if #t 1 #t)")).toEqual(makeOk("(union boolean number)"));
            // (if #t (if #f 1 #t) "ok") -> union(boolean, number, string)
            expect(L5typeof('(if #t (if #f 1 #t) "ok")')).toEqual(makeOk("(union boolean (union number string))"));
            // (if #t 1 2) -> number
            expect(L5typeof('(if #t 1 2)')).toEqual(makeOk("number"));
            // // (if 1 2 3) -> failure
            expect(isFailure(L5typeof('(if 1 2 3)'))).toEqual(true);
        });
        
    });

    // TODO L51 Test checkCompatibleType with unions in arg positions of Procedures
    describe('L5 Test checkCompatibleType with unions in arg positions of Procedures', () => {
        const exp=makeNumExp(6)
        expect(isOk(checkCompatibleType(makeProcTExp([makeUnionTExp([makeNumTExp(),makeBoolTExp()])],makeStrTExp()),makeProcTExp([makeNumTExp()],makeStrTExp()),exp))).toEqual(true);
        expect(isOk(checkCompatibleType(makeProcTExp([makeNumTExp()],makeStrTExp()),makeProcTExp([makeNumTExp()],makeStrTExp()),exp))).toEqual(true);
        expect(isOk(checkCompatibleType(makeProcTExp([makeUnionTExp([makeNumTExp(),makeBoolTExp()])],makeStrTExp()),makeProcTExp([makeUnionTExp([makeNumTExp(),makeBoolTExp()])],makeStrTExp()),exp))).toEqual(true);
        expect(isFailure(checkCompatibleType(makeProcTExp([makeNumTExp()],makeStrTExp()),makeProcTExp([makeUnionTExp([makeNumTExp(),makeBoolTExp()])],makeStrTExp()),exp))).toEqual(true);
    });

});
