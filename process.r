#!/usr/bin/env Rscript

library(tidyr)

continent       <- read.csv('data/continent.csv')
life_expectancy <- read.csv('data/life_expectancy_at_birth.csv')
total_fertility <- read.csv('data/total_fertility.csv')
population      <- read.csv('data/population.csv')

life_expectancy <- gather(life_expectancy,
                          year, life_expectancy,
                          X1800:X2015)
total_fertility <- gather(total_fertility,
                          year, total_fertility,
                          X1800:X2015)
population      <- gather(population,
                          year, population,
                          X1800:X2015)

countries <- merge(life_expectancy, total_fertility,
                   by=c('Country', 'year'))
countries <- merge(countries, population,
                   by=c('Country', 'year'))
countries <- merge(countries, continent, by='Country')

countries <- countries[complete.cases(countries),]
countries$year <- as.numeric(sub('X', '', as.character(countries$year)))
countries$population <- as.numeric(gsub(',', '', countries$population))

countries <- countries[countries$year >= 1950, ]

colnames(countries)[1] = 'country'
colnames(countries)[6] = 'continent'

write.csv(countries, file='data.csv', row.names=FALSE)
