let Default = {

    getLogin: function(){

        return {
            id: 1,
            name: "Weslley",
            mail: "weslley@pliffer.com.br"
        }

    },

    load: function(){

        var login = Default.getLogin();

        $('nav .name').text(login.name);
        $('nav .mail').text(login.mail);

        $('nav .profile-info .img').css('background-image', 'url(public/' + login.id + '/profile.jpg)');

        $('body').addClass('loaded');

        Insight.load();

    }

}

$(function(){

    Default.load();

});