Posts = new Mongo.Collection("pincodes");

if (Meteor.isClient) {
  Meteor.subscribe("posts");

  var options = {
    keepHistory: 1000 * 60 * 5,
    localSearch: true
  };
  var fields = ['officename', 'divisionname', 'Districtname', 'circlename', 'pincode'];

  PincodeSearch = new SearchSource('pincodes', fields, options);

  Template.search_result.helpers({
    pincodes: function() {
      return PincodeSearch.getData({});
    },
    isLoading: function() {
      return PincodeSearch.getStatus().loading;
    }
  });

  Template.search_result.rendered = function() {
    PincodeSearch.search('');
  };

  Template.search_box.events({
    "keyup #search-field": _.throttle(function(e) {
      var text = $(e.target).val().trim();
      PincodeSearch.search(text);
    }, 200)
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {

    Meteor.publish('posts', function(){
        return Posts.find({});
    });

    Posts._ensureIndex({
        officename: 1,
        divisionname: 1,
        Districtname: 1,
        circlename: 1,
        pincode: 1
    }, {
        name: 'pincode_search'
    });

    SearchSource.defineSource('pincodes', function(searchText, options) {
      var options = {limit: 20};

      if(searchText) {
        var regExp = buildRegExp(searchText);
        var selector = {$or: [
          {officename: regExp},
          {divisionname: regExp},
          {Districtname: regExp},
          {circlename: regExp},
          {pincode: regExp}
        ]};

        return Posts.find(selector, options).fetch();
      } else {
        return Posts.find({}, options).fetch();
      }
    });

    function buildRegExp(searchText) {
      // this is a dumb implementation
      var parts = searchText.trim().split(/[ \-\:]+/);
      return new RegExp("(" + parts.join('|') + ")", "ig");
    }

  });
}
