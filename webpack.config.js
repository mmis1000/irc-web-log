// webpack.config.js
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    mode: 'production',
    entry: {
        "channel-admin": "imports-loader?imports=default|jquery|$!./public/js/channel-admin.js",
        // only parts for initial view
        "channel-light": [
            "normalize_css",
            "font_awesome",
            "channel_common_css",
            "header_css"
        ],
        // only parts for initial view
        "channel-light-admin": [
            "normalize_css",
            "font_awesome",
            "channel_common_css",
            "channel_admin_css",
            "header_css"
        ],
        "channel-common": [
            "imports-loader?imports=fancybox,jquery_fancybox_buttons,jquery_fancybox_media,jquery_fancybox_thumbs,default|jquery|$,lazyload!./public/js/channel-common.js",
            "imports-loader?imports=default|hammerjs|Hammer,google_material_icon,moment,polyfill_datepicker,default|jquery|$,lazyload!./public/js/header.js",
            "./public/js/scroll-fix.js"
        ],
        "channel-common-with-live": [
            "imports-loader?imports=fancybox,jquery_fancybox_buttons,jquery_fancybox_media,jquery_fancybox_thumbs,default|jquery|$,lazyload!./public/js/channel-common.js",
            "imports-loader?imports=default|hammerjs|Hammer,google_material_icon,moment,polyfill_datepicker,default|jquery|$,lazyload!./public/js/header.js",
            "imports-loader?imports=moment,default|jquery|$,default|socket_io|io,md5!./public/js/live.js",
            "./public/js/scroll-fix.js"
        ]
    },
    output: {
        path: path.join(__dirname, "public/packed"),
        filename: "[name].entry.js",
        publicPath: "/packed/"
    },
    module: {
        rules: [
            // Extract css files
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },

            {
                test: /jquery\.fancybox\.pack\.js$/,
                use:
                    "imports-loader?imports=default|jquery|jQuery,fancybox_css,jquery_mousewheel,jquery_fancybox_buttons_css,jquery_fancybox_thumbs_css"
            },
            {
                test: /(\/jquery\.fancybox-|\/jquery\.mousewheel-).+\.js$/,
                use:
                    "imports-loader?imports=default|jquery|jQuery"
            },
            { test: /polyfill-datepicker\.js$/, use: 'imports-loader?imports=default|jquery|$,bootstrap_material_datetimepicker' },
            { test: /bootstrap-material-datetimepicker\.js$/, use: "imports-loader?imports=moment,default|jquery|jQuery,bootstrap_material_datetimepicker_css" },
            { test: /jquery\.lazyload\.js$$/, use: "imports-loader?imports=default|jquery|jQuery" },

            { test: /\.js$/, use: 'uglify-loader' },

            {
                test: /\.eot/, type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024 // 4kb
                    }
                }
            },
            {
                test: /\.woff2(\?\S*)?$/, type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024 // 4kb
                    }
                }
            },
            {
                test: /\.woff(\?\S*)?$/, type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024 // 4kb
                    }
                }
            },
            {
                test: /\.ttf(\?\S*)?$/, type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024 // 4kb
                    }
                }
            },
            {
                test: /\.svg(\?\S*)?$/, type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024 // 4kb
                    }
                }
            },
            { test: /\.png$|\.jpg$|\.webp$|\.gif/, type: 'asset/resource' }
        ]
    },
    resolve: {
        modules: [
            path.resolve(__dirname, 'public/'),
            'node_modules'
        ],
        extensions: ['', '.js', '.json', '.html', '.css'],
        alias: {
            "jquery":
                path.resolve(__dirname, "public/components/jquery/dist/jquery.min.js"),
            "fancybox":
                path.resolve(__dirname, "public/components/fancybox/source/jquery.fancybox.pack.js"),
            "bootstrap_material_datetimepicker":
                path.resolve(__dirname, "public/components/bootstrap-material-datetimepicker/js/bootstrap-material-datetimepicker.js"),
            "moment":
                path.resolve(__dirname, "public/components/moment/moment.js"),
            "md5":
                path.resolve(__dirname, "public/js/md5.min.js"),
            "hammerjs":
                path.resolve(__dirname, "public/components/hammerjs/hammer.js"),
            "socket_io":
                getSocketIoPath(__dirname),
            "lazyload":
                path.resolve(__dirname, "public/js/jquery.lazyload.js"),
            "polyfill_datepicker":
                path.resolve(__dirname, "public/js/polyfill-datepicker.js"),
            "bootstrap_material_datetimepicker_css":
                path.resolve(__dirname, "public/components/bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css"),
            "channel_common_css":
                path.resolve(__dirname, "public/css/channel.css"),
            "channel_admin_css":
                path.resolve(__dirname, "public/css/channel-admin.css"),
            "header_css":
                path.resolve(__dirname, "public/css/header.css"),
            "google_material_icon":
                path.resolve(__dirname, "public/css/google-material-icon.css"),
            "font_awesome":
                path.resolve(__dirname, "public/components/font-awesome/css/font-awesome.min.css"),
            "normalize_css":
                path.resolve(__dirname, "public/components/normalize-css/normalize.css"),

            "fancybox_css":
                path.resolve(__dirname, "public/components/fancybox/source/jquery.fancybox.css"),
            "jquery_mousewheel":
                path.resolve(__dirname, "public/components/fancybox/lib/jquery.mousewheel-3.0.6.pack.js"),
            "jquery_fancybox_buttons_css":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-buttons.css"),
            "jquery_fancybox_buttons":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-buttons.js"),
            "jquery_fancybox_media":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-media.js"),
            "jquery_fancybox_thumbs":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-thumbs.js"),
            "jquery_fancybox_thumbs_css":
                path.resolve(__dirname, "public/components/fancybox/source/helpers/jquery.fancybox-thumbs.css"),
        }
    },
    optimization: {
        minimizer: [
            // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
    // Use the plugin to specify the resulting filename (and add needed behavior to the compiler)
    plugins: [
        new MiniCssExtractPlugin({
            chunkFilename: "[name].css"
        })
    ]
}

function getSocketIoPath(basePath) {
    var sioPath, fs = require('fs');
    try {
        sioPath = path.resolve(basePath, "node_modules/socket.io/node_modules/socket.io-client/");
        fs.statSync(sioPath);
        return sioPath;
    } catch (e) { }

    try {
        sioPath = path.resolve(basePath, "node_modules/socket.io-client/");
        fs.statSync(sioPath);
        return sioPath;
    } catch (e) { }

    throw new Error('cannot find socket io at expected path, please do npm install first')
}