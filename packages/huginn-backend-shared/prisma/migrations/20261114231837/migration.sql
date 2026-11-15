-- DropForeignKey
ALTER TABLE "UserExpression" DROP CONSTRAINT "UserExpression_expression_fkey";

-- AddForeignKey
ALTER TABLE "UserExpression" ADD CONSTRAINT "UserExpression_kind_type_expressionId_fkey" FOREIGN KEY ("kind", "type", "expressionId") REFERENCES "Expression"("kind", "type", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
