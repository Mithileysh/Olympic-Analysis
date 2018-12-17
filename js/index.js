//RedSift
    //Showcasing the d3_rs_lines library 
    //The chart shows a streamgraph using different property of the library

    //chart containing both gender
    let atheleteGender = ['Men', 'Women']; //array containing each athelete gender
    let chartPosition = ['#menChart', '#womenChart']; //position of the charts

    const ANIMATION_TIME_MS = 666;    //animation transition in millisecond

    let csv = (url) => new Promise((ok, ko) => d3.csv(url, (err, data) => err ? ko(err) : ok(data))); //check url 

    let allMedalists = csv('https://static.redsift.io/assets/data/summer-olympics-1896-to-2008/all-medalists.csv'); //get data from doc in csv format

    //accessing allMedalists data
    allMedalists
      .then(data => {
        let eventGroups = d3.nest()
          .key(d => d.Edition + d.Event + d.Event_gender + d.Sport + d.Medal + d.NOC) //combining keys to award team sport 1 medals rather than each athlete and joint podium
          .entries(data) //return the keys and values of the array
          .map(d => { //map the data
            let e = d.values[0]; //get values from array
            return { //return all the data contained in value 
              Edition: parseInt(e.Edition),
              Group: d.values.length,
              Medal: e.Medal,
              Gender: e.Gender,
              NOC: e.NOC,
              Event: e.Event
            };
          })

        let topCountries = ['USA', 'URS', 'GBR', 'FRA', 'ITA', 'GER', 'SWE', 'HUN', 'AUS', 'GDR']; //countries to filter

        const numCountries = topCountries.length; //number of countries

        let dataSet = []; //empty array to contain both athlete dataSet

        atheleteGender.forEach(theGender => { //map both genders   

         let countrySummary = topCountries.map(theCountry => { //map countries

            //using crossfilter https://github.com/crossfilter/crossfilter/wiki/API-Reference 
            let cross = crossfilter(eventGroups); //crossfilter to access and filter data            

            let editions = cross.dimension(d => d.Edition); //get the years
            let years = editions.group(); //group by years

            let nocs = cross.dimension(d => d.NOC); //get the countries data  
            let medals = cross.dimension(d => d.Medal); //get the medals data
            let gender = cross.dimension(d => d.Gender); //get the gender data

            //group all data by year
            let medalsCount = years.all(); 

            //filter the data    
            nocs.filterExact(theCountry); //filter each country
            medals.filterExact('Gold'); //filter by gold medals
            gender.filterExact(theGender); //filter each gender 

            return medalsCount; //return the filtered data
          });

          let numMedalsPerYearForAllCountries = {}; //new object

          countrySummary.forEach(currentCountry => { //iterate through the each country
            currentCountry.forEach(dataPoint => { //iterate through each years and medals    
              const year = dataPoint.key; //assign the key which is the year to year 
              const medals = dataPoint.value; //assign the value which is the medal to medals

              if (!numMedalsPerYearForAllCountries[year]) { //check if the key which is the year exist
                numMedalsPerYearForAllCountries[year] = { //if not create one
                  year: year,
                  medals: []
                };
              }

              numMedalsPerYearForAllCountries[year].medals.push(medals); //push number of medals for each year
            })
          })

          const years = Object.keys(numMedalsPerYearForAllCountries); //get all the years

          data = years.map(year => {  //loop through each year
            const dataPoint = numMedalsPerYearForAllCountries[year]; //assign all the years and the medals 
            const date = new Date(dataPoint.year, 1, 1); //set year with a dummy day and month 
            const result = date.getTime(); //return years in time format
            return {
              l: date, //return years
              v: dataPoint.medals //return number of medals
            };
          })

          dataSet.push(data); //push the data to the dataSet which will include both gender dataSet       
        })

        //create the chart

        function createLineChart() {

          return d3_rs_lines.html()
            .width(600) //change the width of chart 
            .stacked(true) //enable stacking
            .stackOffset('stackOffsetWiggle') //moving the chart from the baseline
            .stackOrder('stackOrderInsideOut') //stack order
            .axisDisplayIndex(false) //axis display for Index
            .niceIndex(false) //gap between chart Value axis to start of chart 
            .tickCountValue(0) //label on Value axis
            .gridIndex(true) //allow grid along Index
            .labelTime('%Y') //label time 
            .tickCountIndex(5) //number of ticks on the Index axis  
            .highlightIndex([{ //highlight a particular Index
              l: "1980/84 Olympics boycotts", //legend for highlighted section
              v: [new Date(1980, 1, 1).getTime()] //index to highlight
            }, { 
              v: [new Date(1984, 1, 1).getTime()] //index to highlight
            }])
            .legend(['USA', 'URS', 'GBR', 'FRA', 'ITA', 'GER', 'SWE', 'HUN', 'AUS', 'GDR']) //add legend 
            .legendOrientation('buttom'); //legend orientation                                                 
        }

        let menSpecificInfo = createLineChart() //continue chaining the line chart to highlight specifici man data
          .tipHtml((d, i, s) => { //add info to tip of the chart
            if (topCountries[s] == 'USA' & d.l.getFullYear() == 2008) {
              return 'Micheal Phelps winning 8<br>gold medals for USA<br><img width="200" height="100" src="https://67.media.tumblr.com/e926fc00fc7d19f9186771dc7b826012/tumblr_obphdt9gLY1v5x3w3o1_400.gif"/><br><br>USA Year: 2008 Medals:' + d.v[0]
            } else {
              return topCountries[s] + ' Year:' + d.l.getFullYear() + ' Medals:' + d.v[s]
            }
          });

        let womenSpecificInfo = createLineChart() //continue chaining the line chart to highlight specific woman data
          .tipHtml((d, i, s) => { //add info to tip of the chart
            if (topCountries[s] == 'GBR' & d.l.getFullYear() == 1900) {
              return 'First woman gold medalist<br>Countess Hélène de Pourtalès<br><img width="200" height="100" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Helene_de_Pourtales.jpg/220px-Helene_de_Pourtales.jpg"/><br><br>GBR Year: 1900 Medals:' + d.v[2]
            } else {
              return topCountries[s] + ' Year:' + d.l.getFullYear() + ' Medals:' + d.v[s]
            }
          }
         
          );

        let chartInfo = []; //create an empty array

        chartInfo = [menSpecificInfo, womenSpecificInfo]; //chart info for specific gender 

        //add first country chart
        for (i = 0; i < dataSet.length; i++) {

          const eachGenderFirstData = generateDataForTime(dataSet[i], 1); //generate first set of data 

          d3.select(chartPosition[i]) //chart position
            .datum(eachGenderFirstData) //add data by gender
            .call(chartInfo[i]);      //call the chart including info for specific gender
        }

        //to generate each country 
        function animate(i, idx) {        
          idx = idx + 1;
          if (idx === numCountries) return;     //iterate until condition is met
          
          const eachGenderData = generateDataForTime(dataSet[i], idx); //generate each set each country data for the specific gender

          d3.select(chartPosition[i]) //chart position
              .datum(eachGenderData) //add data by gender
              .transition()          //animate the dataSet
              .duration(ANIMATION_TIME_MS)        //country data are added each duration
              .call(chartInfo[i])    //call the chart including info for specific gender
              .on('end',function() {    //at the end of the transidition 
                animate(i, idx);    //call the animate function
              });
        }

        for (i = 0; i < dataSet.length; i++) {      
          animate(i, 0);        //call the function 
        }
        
      })

    function generateDataForTime(allData, numSelectedCountries) { 
      return allData.map((item) => { //map allData
        let selectedMedals = item.v.map((value, idx) => { //select medals at idx
          if (idx < numSelectedCountries) {
            return value; //return the number of medals if the idx is less than the number of countries
          } else {  
            return 0;
          }
        });

        return {
          'l': item.l, //return the year
          'v': selectedMedals //return the medal
        };
      });
    }