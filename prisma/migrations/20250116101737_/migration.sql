-- CreateTable
CREATE TABLE "Date" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "existence" BOOLEAN NOT NULL DEFAULT true,
    "rest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Date_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "dateId" INTEGER NOT NULL,
    "meal" VARCHAR(30) NOT NULL,
    "code" VARCHAR(30),

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Date_date_key" ON "Date"("date");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_dateId_fkey" FOREIGN KEY ("dateId") REFERENCES "Date"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
