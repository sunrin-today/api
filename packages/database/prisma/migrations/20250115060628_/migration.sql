-- CreateTable
CREATE TABLE `Date` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `existence` BOOLEAN NOT NULL DEFAULT true,
    `rest` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Date_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateId` INTEGER NOT NULL,
    `meal` VARCHAR(30) NOT NULL,
    `code` VARCHAR(30) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Meal` ADD CONSTRAINT `Meal_dateId_fkey` FOREIGN KEY (`dateId`) REFERENCES `Date`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
